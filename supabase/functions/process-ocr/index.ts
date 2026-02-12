// supabase/functions/process-ocr/index.ts 
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ===================== CONFIGURATION =====================
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GOOGLE_PROJECT_ID = Deno.env.get("GOOGLE_PROJECT_ID")!;
const GOOGLE_CLIENT_EMAIL = Deno.env.get("GOOGLE_CLIENT_EMAIL")!;
const GOOGLE_PRIVATE_KEY = Deno.env.get("GOOGLE_PRIVATE_KEY")!.replace(/\\n/g, "\n");
const GCS_BUCKET = Deno.env.get("GCS_BUCKET") || `${GOOGLE_PROJECT_ID}-ocr-temp`;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const EMAIL_FROM = Deno.env.get("EMAIL_FROM") || "notify@snapparchive.eu";

const MAX_BATCH_SIZE = 50;
const MAX_PARALLEL_PROCESSING = 10;
const PDF_PAGE_BATCH_SIZE = 50;
const TIMEOUT_SECONDS = 45;

// ===================== CORS HEADERS =====================
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-worker-id',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ===================== UTILITIES =====================
function abToBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

// ===================== EMAIL TEMPLATES =====================
function getOCRCompleteEmailHTML(title: string, fileName: string, textLength: number): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>OCR Processing Complete</title></head><body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;"><div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);"><div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 40px 20px; text-align: center;"><h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">OCR Processing Complete</h1></div><div style="padding: 40px 30px;"><p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">Your document has been successfully processed and is now searchable.</p><div style="background-color: #f8f9fa; border-left: 4px solid #28a745; border-radius: 4px; padding: 20px; margin: 30px 0;"><h3 style="margin: 0 0 10px; font-size: 18px; color: #28a745;">Document Details</h3><p style="margin: 0 0 8px; font-size: 14px; line-height: 1.6; color: #666666;"><strong>Title:</strong> ${title}</p><p style="margin: 0 0 8px; font-size: 14px; line-height: 1.6; color: #666666;"><strong>File:</strong> ${fileName}</p><p style="margin: 0; font-size: 14px; line-height: 1.6; color: #666666;"><strong>Text Extracted:</strong> ${textLength.toLocaleString()} characters</p></div><p style="margin: 0 0 15px; font-size: 14px; line-height: 1.6; color: #666666;">You can now search and view the extracted text in your dashboard.</p></div><div style="background-color: #f8f9fa; padding: 20px 30px; border-top: 1px solid #e9ecef;"><p style="margin: 0; font-size: 12px; color: #999999; text-align: center;">© 2024 SnappArchive. All rights reserved.</p></div></div></body></html>`;
}

function getOCRFailedEmailHTML(title: string, fileName: string, error: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>OCR Processing Failed</title></head><body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;"><div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);"><div style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); padding: 40px 20px; text-align: center;"><h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">OCR Processing Failed</h1></div><div style="padding: 40px 30px;"><p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">Unfortunately, we couldn't process your document. You can retry the OCR processing from your dashboard.</p><div style="background-color: #f8f9fa; border-left: 4px solid #dc3545; border-radius: 4px; padding: 20px; margin: 30px 0;"><h3 style="margin: 0 0 10px; font-size: 18px; color: #dc3545;">Document Details</h3><p style="margin: 0 0 8px; font-size: 14px; line-height: 1.6; color: #666666;"><strong>Title:</strong> ${title}</p><p style="margin: 0 0 8px; font-size: 14px; line-height: 1.6; color: #666666;"><strong>File:</strong> ${fileName}</p><p style="margin: 0; font-size: 14px; line-height: 1.6; color: #666666;"><strong>Error:</strong> ${error}</p></div><p style="margin: 0 0 15px; font-size: 14px; line-height: 1.6; color: #666666;">Please check your document and try again. If the problem persists, contact our support team.</p></div><div style="background-color: #f8f9fa; padding: 20px 30px; border-top: 1px solid #e9ecef;"><p style="margin: 0; font-size: 12px; color: #999999; text-align: center;">© 2024 SnappArchive. All rights reserved.</p></div></div></body></html>`;
}

// ===================== GOOGLE AUTH =====================
let cachedToken: { token: string; expires: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expires - 60000) {
    return cachedToken.token;
  }

  const now = Math.floor(Date.now() / 1000);
  const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = btoa(
    JSON.stringify({
      iss: GOOGLE_CLIENT_EMAIL,
      scope: "https://www.googleapis.com/auth/cloud-vision https://www.googleapis.com/auth/devstorage.read_write",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    })
  );

  const pem = GOOGLE_PRIVATE_KEY
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\n/g, "");

  const binaryDer = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    "pkcs8",
    binaryDer.buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(`${header}.${claim}`)
  );

  const jwt = `${header}.${claim}.${btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const json = await res.json();
  if (!json.access_token) throw new Error("Google auth failed");
  
  cachedToken = {
    token: json.access_token,
    expires: Date.now() + 3500000,
  };
  
  return json.access_token;
}

// ===================== FILE OPERATIONS =====================
async function downloadFile(url: string): Promise<ArrayBuffer> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_SECONDS * 1000);
  
  try {
    const r = await fetch(url, { signal: controller.signal });
    if (!r.ok) throw new Error(`Download failed: ${r.status}`);
    return await r.arrayBuffer();
  } finally {
    clearTimeout(timeoutId);
  }
}

async function uploadPDF(buffer: ArrayBuffer, name: string, token: string): Promise<string> {
  const path = `ocr/${Date.now()}-${name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  const r = await fetch(
    `https://storage.googleapis.com/upload/storage/v1/b/${GCS_BUCKET}/o?uploadType=media&name=${encodeURIComponent(path)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/pdf",
      },
      body: buffer,
    }
  );

  if (!r.ok) throw new Error(`GCS upload failed: ${r.status}`);
  return `gs://${GCS_BUCKET}/${path}`;
}

// ===================== OCR OPERATIONS =====================
async function ocrImage(buffer: ArrayBuffer, token: string): Promise<string> {
  const r = await fetch("https://vision.googleapis.com/v1/images:annotate", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      requests: [{
        image: { content: abToBase64(buffer) },
        features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
      }],
    }),
  });

  const j = await r.json();
  return j.responses?.[0]?.fullTextAnnotation?.text || "";
}

async function ocrPDF(gcsUri: string, token: string): Promise<string> {
  const outputPrefix = `${gcsUri}-output/`;

  const submit = await fetch("https://vision.googleapis.com/v1/files:asyncBatchAnnotate", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      requests: [{
        inputConfig: {
          gcsSource: { uri: gcsUri },
          mimeType: "application/pdf",
        },
        features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
        outputConfig: {
          gcsDestination: { uri: outputPrefix },
          batchSize: PDF_PAGE_BATCH_SIZE,
        },
      }],
    }),
  });

  const submitJson = await submit.json();
  const operation = submitJson.name;
  if (!operation) throw new Error("Vision API submission failed");

  // Poll for completion
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 500));

    const op = await fetch(`https://vision.googleapis.com/v1/${operation}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.json());

    if (op.done) {
      if (op.error) throw new Error(`Vision API error: ${op.error.message}`);
      break;
    }
    
    if (i === 59) throw new Error("PDF OCR timeout (30s exceeded)");
  }

  // Read output files
  const list = await fetch(
    `https://storage.googleapis.com/storage/v1/b/${GCS_BUCKET}/o?prefix=${encodeURIComponent(
      outputPrefix.replace(`gs://${GCS_BUCKET}/`, "")
    )}`,
    { headers: { Authorization: `Bearer ${token}` } }
  ).then((r) => r.json());

  let text = "";
  for (const file of list.items || []) {
    const content = await fetch(
      `https://storage.googleapis.com/storage/v1/b/${GCS_BUCKET}/o/${encodeURIComponent(
        file.name
      )}?alt=media`,
      { headers: { Authorization: `Bearer ${token}` } }
    ).then((r) => r.json());

    for (const r of content.responses || []) {
      if (r.fullTextAnnotation?.text) {
        text += r.fullTextAnnotation.text + "\n\n";
      }
    }
  }

  if (!text.trim()) throw new Error("No text extracted from PDF");
  return text.trim();
}

function isUUIDv4(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

// ===================== NOTIFICATION =====================
async function sendOCRNotification(
  userId: string,
  type: 'ocr_complete' | 'ocr_failed',
  documentTitle: string,
  fileName: string,
  textLength?: number,
  errorMessage?: string
) {
  try {
    if (!userId || !isUUIDv4(userId)) {
      console.warn(`Invalid userId, skipping notification: ${userId}`);
      return;
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: { user } } = await supabase.auth.admin.getUserById(userId);

    if (!user?.email) {
      console.warn(`User email not found for notification: ${userId}`);
      return;
    }

    // Check notification preferences
    const { data: profile } = await supabase
      .from('profiles')
      .select('notify_ocr_complete, notify_ocr_failed')
      .eq('id', userId)
      .single();

    if (type === 'ocr_complete' && !profile?.notify_ocr_complete) {
      console.log('OCR complete notification disabled for user');
      return;
    }
    if (type === 'ocr_failed' && !profile?.notify_ocr_failed) {
      console.log('OCR failed notification disabled for user');
      return;
    }

    // Send email via Resend
    if (!RESEND_API_KEY) {
      console.log('Resend API key not configured - skipping email');
      return;
    }

    let template;
    if (type === 'ocr_complete') {
      template = {
        subject: `OCR Complete: ${documentTitle}`,
        html: getOCRCompleteEmailHTML(documentTitle, fileName, textLength || 0),
      };
    } else {
      template = {
        subject: `OCR Failed: ${documentTitle}`,
        html: getOCRFailedEmailHTML(documentTitle, fileName, errorMessage || 'Unknown error'),
      };
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `SnappArchive <${EMAIL_FROM}>`,
        to: user.email,
        subject: template.subject,
        html: template.html,
      }),
    });

    if (!response.ok) {
      console.error(`Failed to send ${type} notification:`, await response.text());
    } else {
      console.log(`✉️  ${type} notification sent to ${user.email}`);
    }
  } catch (error) {
    console.error(`Error sending ${type} notification:`, error);
  }
}

// ===================== PROCESS DOCUMENT =====================
async function processDocument(doc: any, token: string, supabase: any) {
  const startTime = Date.now();
  const docInfo = `[${doc.id.slice(0, 8)}] ${doc.file_name}`;
  
  try {
    console.log(`${docInfo} 🚀 Starting OCR...`);
    
    const buffer = await downloadFile(doc.file_url);
    const isPDF = doc.file_name.toLowerCase().endsWith(".pdf");
    
    const text = isPDF
      ? await ocrPDF(await uploadPDF(buffer, doc.file_name, token), token)
      : await ocrImage(buffer, token);

    await supabase.rpc("update_ocr_result_with_metrics", {
      document_id: doc.id,
      status: "completed",
      extracted_text: text,
      error_message: null,
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`${docInfo} ✅ Completed in ${duration}s (${text.length} chars)`);
    
    // Send success notification
    await sendOCRNotification(
      doc.user_id,
      'ocr_complete',
      doc.title,
      doc.file_name,
      text.length
    );
    
    return { 
      id: doc.id, 
      status: "completed", 
      duration: parseFloat(duration),
      text_length: text.length
    };
  } catch (e: any) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error(`${docInfo} ❌ Failed in ${duration}s:`, e.message);
    
    await supabase.rpc("update_ocr_result_with_metrics", {
      document_id: doc.id,
      status: "failed",
      extracted_text: null,
      error_message: e.message.slice(0, 500),
    });
    
    // Send failure notification
    await sendOCRNotification(
      doc.user_id,
      'ocr_failed',
      doc.title,
      doc.file_name,
      undefined,
      e.message
    );
    
    return { 
      id: doc.id, 
      status: "failed", 
      error: e.message,
      duration: parseFloat(duration)
    };
  }
}

// ===================== MAIN HANDLER WITH CORS =====================
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: corsHeaders 
    });
  }

  const totalStartTime = Date.now();
  const workerID = req.headers.get("X-Worker-ID") || "1";
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  console.log(`\n⚡ Worker ${workerID}: Starting OCR processor...`);

  try {
    const token = await getAccessToken();

    const { data: docs, error } = await supabase.rpc("get_ocr_batch_smart", {
      batch_size: MAX_BATCH_SIZE,
    });

    if (error) {
      console.error("❌ Database error:", error);
      return new Response(
        JSON.stringify({ error: error.message }), 
        { 
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    if (!docs || docs.length === 0) {
      console.log(`📭 Worker ${workerID}: No documents in queue`);
      return new Response(
        JSON.stringify({
          worker_id: workerID,
          processed: 0,
          message: "Queue empty",
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    console.log(`📦 Worker ${workerID}: Processing ${docs.length} documents`);

    const results = [];
    const chunkSize = MAX_PARALLEL_PROCESSING;

    for (let i = 0; i < docs.length; i += chunkSize) {
      const chunk = docs.slice(i, i + chunkSize);
      console.log(
        `   Processing chunk ${Math.floor(i / chunkSize) + 1}/${Math.ceil(docs.length / chunkSize)}...`
      );

      const chunkResults = await Promise.allSettled(
        chunk.map(doc => processDocument(doc, token, supabase))
      );

      results.push(
        ...chunkResults.map(r =>
          r.status === "fulfilled"
            ? r.value
            : { status: "failed", error: r.reason?.message || "Unknown error" }
        )
      );
    }

    const successCount = results.filter(r => r.status === "completed").length;
    const failCount = results.filter(r => r.status === "failed").length;
    const avgDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0) / results.length;
    const totalDuration = ((Date.now() - totalStartTime) / 1000).toFixed(2);

    console.log(`\n📊 Worker ${workerID} Summary:`);
    console.log(`   ✅ Completed: ${successCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
    console.log(`   ⏱️  Avg time: ${avgDuration.toFixed(2)}s per doc`);
    console.log(`   ⏱️  Total time: ${totalDuration}s\n`);

    return new Response(
      JSON.stringify({
        success: true,
        worker_id: workerID,
        processed: docs.length,
        completed: successCount,
        failed: failCount,
        avg_duration_per_doc: parseFloat(avgDuration.toFixed(2)),
        total_duration: parseFloat(totalDuration),
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error: any) {
    console.error(`❌ Worker ${workerID} fatal error:`, error);
    return new Response(
      JSON.stringify({ 
        error: error.message, 
        worker_id: workerID 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});