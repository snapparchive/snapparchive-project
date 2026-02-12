// lib/logger.ts

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

export enum LogCategory {
  OCR = 'OCR',
  AUTH = 'AUTH',
  UPLOAD = 'UPLOAD',
  DATABASE = 'DATABASE',
  API = 'API',
  USER_ACTION = 'USER_ACTION',
  SYSTEM = 'SYSTEM',
  DASHBOARD = 'DASHBOARD',
  STORAGE = 'STORAGE',
  FOLDER = 'FOLDER',
  TAG = 'TAG',
  DOCUMENT = 'DOCUMENT',
  SUBSCRIPTION = 'SUBSCRIPTION',
  EMAIL = 'EMAIL',
  SECURITY = 'SECURITY',
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  userId?: string;
  documentId?: string;
  error?: Error | unknown;
  metadata?: Record<string, any>;
  stackTrace?: string;
}

class Logger {
  private isDevelopment: boolean;
  private enableConsole: boolean;
  private enableDatabase: boolean;
  private logQueue: LogEntry[] = [];
  private flushInterval: number = 5000; // 5 seconds
  private maxQueueSize: number = 100;
  private isFlushingQueue: boolean = false;
  private isClient: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.enableConsole = true;
    this.enableDatabase = process.env.NEXT_PUBLIC_ENABLE_DB_LOGGING === 'true';
    this.isClient = typeof window !== 'undefined';

    // Start periodic queue flushing only on client-side
    if (this.enableDatabase && this.isClient) {
      setInterval(() => this.flushQueue(), this.flushInterval);
    }
  }

  private formatLog(entry: LogEntry): string {
    const { timestamp, level, category, message, userId, documentId, metadata } = entry;
    let formatted = `[${timestamp}] [${level}] [${category}]`;
    
    if (userId) formatted += ` [User: ${userId.substring(0, 8)}...]`;
    if (documentId) formatted += ` [Doc: ${documentId.substring(0, 8)}...]`;
    
    formatted += ` ${message}`;
    
    if (metadata && Object.keys(metadata).length > 0) {
      formatted += ` | Metadata: ${JSON.stringify(metadata)}`;
    }
    
    return formatted;
  }

  private async flushQueue(): Promise<void> {
    if (this.isFlushingQueue || this.logQueue.length === 0) return;

    this.isFlushingQueue = true;
    const logsToFlush = [...this.logQueue];
    this.logQueue = [];

    try {
      // Send logs to API endpoint instead of directly to Supabase
      const response = await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ logs: logsToFlush }),
      });

      if (!response.ok) {
        console.error('Failed to flush logs to server:', response.statusText);
        // Re-queue failed logs (but limit re-queuing to prevent infinite growth)
        if (this.logQueue.length < this.maxQueueSize * 2) {
          this.logQueue.unshift(...logsToFlush);
        }
      }
    } catch (error) {
      console.error('Failed to flush log queue:', error);
      // Re-queue failed logs (but limit re-queuing to prevent infinite growth)
      if (this.logQueue.length < this.maxQueueSize * 2) {
        this.logQueue.unshift(...logsToFlush);
      }
    } finally {
      this.isFlushingQueue = false;
    }
  }

  private async saveToDatabase(entry: LogEntry): Promise<void> {
    if (!this.enableDatabase || !this.isClient) return;

    // Add to queue instead of immediate save
    this.logQueue.push(entry);

    // If queue is too large, flush immediately
    if (this.logQueue.length >= this.maxQueueSize) {
      await this.flushQueue();
    }
  }

  private log(
    level: LogLevel,
    category: LogCategory,
    message: string,
    options?: {
      userId?: string;
      documentId?: string;
      error?: Error | unknown;
      metadata?: Record<string, any>;
    }
  ): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      userId: options?.userId,
      documentId: options?.documentId,
      error: options?.error,
      metadata: options?.metadata,
      stackTrace: options?.error instanceof Error ? options.error.stack : undefined,
    };

    const formattedLog = this.formatLog(entry);

    if (this.enableConsole) {
      switch (level) {
        case LogLevel.DEBUG:
          if (this.isDevelopment) console.debug(formattedLog);
          break;
        case LogLevel.INFO:
          console.info(formattedLog);
          break;
        case LogLevel.WARN:
          console.warn(formattedLog);
          break;
        case LogLevel.ERROR:
        case LogLevel.CRITICAL:
          console.error(formattedLog);
          if (entry.stackTrace) console.error(entry.stackTrace);
          break;
      }
    }

    // Save to database asynchronously (don't await to avoid blocking)
    this.saveToDatabase(entry).catch(err => {
      console.error('Logger database save failed:', err);
    });
  }

  // ============================================
  // OCR LOGGING
  // ============================================

  ocrQueued(documentId: string, userId: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.INFO, LogCategory.OCR, 'Document queued for OCR processing', {
      documentId,
      userId,
      metadata,
    });
  }

  ocrStarted(documentId: string, userId: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.INFO, LogCategory.OCR, 'OCR processing started', {
      documentId,
      userId,
      metadata,
    });
  }

  ocrCompleted(documentId: string, userId: string, duration?: number, textLength?: number): void {
    this.log(LogLevel.INFO, LogCategory.OCR, 'OCR processing completed successfully', {
      documentId,
      userId,
      metadata: { duration, textLength },
    });
  }

  ocrFailed(documentId: string, userId: string, error: Error | unknown, retryCount?: number): void {
    this.log(LogLevel.ERROR, LogCategory.OCR, 'OCR processing failed', {
      documentId,
      userId,
      error,
      metadata: {
        errorMessage: error instanceof Error ? error.message : String(error),
        retryCount,
      },
    });
  }

  ocrRetrying(documentId: string, userId: string, retryCount: number): void {
    this.log(LogLevel.WARN, LogCategory.OCR, `OCR retry attempt #${retryCount}`, {
      documentId,
      userId,
      metadata: { retryCount },
    });
  }

  // ============================================
  // UPLOAD LOGGING
  // ============================================

  uploadStarted(fileName: string, userId: string, fileSize: number, fileType: string): void {
    this.log(LogLevel.INFO, LogCategory.UPLOAD, `Upload started: ${fileName}`, {
      userId,
      metadata: { fileName, fileSize, fileType },
    });
  }

  uploadProgress(fileName: string, userId: string, progress: number): void {
    if (this.isDevelopment) {
      this.log(LogLevel.DEBUG, LogCategory.UPLOAD, `Upload progress: ${fileName} - ${progress}%`, {
        userId,
        metadata: { fileName, progress },
      });
    }
  }

  uploadCompleted(documentId: string, fileName: string, userId: string, fileSize: number): void {
    this.log(LogLevel.INFO, LogCategory.UPLOAD, `Upload completed: ${fileName}`, {
      documentId,
      userId,
      metadata: { fileName, fileSize },
    });
  }

  uploadFailed(fileName: string, userId: string, error: Error | unknown): void {
    this.log(LogLevel.ERROR, LogCategory.UPLOAD, `Upload failed: ${fileName}`, {
      userId,
      error,
      metadata: { fileName },
    });
  }

  // ============================================
  // AUTH LOGGING
  // ============================================

  userLogin(userId: string, email: string, method?: string): void {
    this.log(LogLevel.INFO, LogCategory.AUTH, 'User logged in', {
      userId,
      metadata: { email, method: method || 'email/password' },
    });
  }

  userLogout(userId: string): void {
    this.log(LogLevel.INFO, LogCategory.AUTH, 'User logged out', {
      userId,
    });
  }

  userRegistered(userId: string, email: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.INFO, LogCategory.AUTH, 'New user registered', {
      userId,
      metadata: { email, ...metadata },
    });
  }

  authFailed(email: string, error: Error | unknown, attemptCount?: number): void {
    this.log(LogLevel.WARN, LogCategory.AUTH, 'Authentication failed', {
      error,
      metadata: { email, attemptCount },
    });
  }

  accountLocked(email: string, duration: number): void {
    this.log(LogLevel.WARN, LogCategory.SECURITY, 'Account temporarily locked', {
      metadata: { email, lockDurationMinutes: duration / 60000 },
    });
  }

  passwordReset(email: string): void {
    this.log(LogLevel.INFO, LogCategory.AUTH, 'Password reset requested', {
      metadata: { email },
    });
  }

  passwordChanged(userId: string): void {
    this.log(LogLevel.INFO, LogCategory.AUTH, 'Password changed successfully', {
      userId,
    });
  }

  // ============================================
  // DOCUMENT LOGGING
  // ============================================

  documentCreated(documentId: string, userId: string, title: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.INFO, LogCategory.DOCUMENT, `Document created: ${title}`, {
      documentId,
      userId,
      metadata: { title, ...metadata },
    });
  }

  documentUpdated(documentId: string, userId: string, changes: Record<string, any>): void {
    this.log(LogLevel.INFO, LogCategory.DOCUMENT, 'Document updated', {
      documentId,
      userId,
      metadata: { changes },
    });
  }

  documentDeleted(documentId: string, userId: string, title?: string): void {
    this.log(LogLevel.INFO, LogCategory.DOCUMENT, `Document deleted${title ? `: ${title}` : ''}`, {
      documentId,
      userId,
      metadata: { title },
    });
  }

  documentRestored(documentId: string, userId: string): void {
    this.log(LogLevel.INFO, LogCategory.DOCUMENT, 'Document restored from trash', {
      documentId,
      userId,
    });
  }

  documentShared(documentId: string, userId: string, publicLink: string): void {
    this.log(LogLevel.INFO, LogCategory.DOCUMENT, 'Document shared publicly', {
      documentId,
      userId,
      metadata: { publicLink },
    });
  }

  documentDownloaded(documentId: string, userId: string, fileName: string): void {
    this.log(LogLevel.INFO, LogCategory.DOCUMENT, `Document downloaded: ${fileName}`, {
      documentId,
      userId,
      metadata: { fileName },
    });
  }

  // ============================================
  // FOLDER LOGGING
  // ============================================

  folderCreated(folderId: string, userId: string, folderName: string, parentId?: string): void {
    this.log(LogLevel.INFO, LogCategory.FOLDER, `Folder created: ${folderName}`, {
      userId,
      metadata: { folderId, folderName, parentId },
    });
  }

  folderUpdated(folderId: string, userId: string, changes: Record<string, any>): void {
    this.log(LogLevel.INFO, LogCategory.FOLDER, 'Folder updated', {
      userId,
      metadata: { folderId, changes },
    });
  }

  folderDeleted(folderId: string, userId: string, folderName: string): void {
    this.log(LogLevel.INFO, LogCategory.FOLDER, `Folder deleted: ${folderName}`, {
      userId,
      metadata: { folderId, folderName },
    });
  }

  documentsMoved(documentIds: string[], userId: string, targetFolderId: string | null, count: number): void {
    this.log(LogLevel.INFO, LogCategory.FOLDER, `${count} document(s) moved to ${targetFolderId ? 'folder' : 'root'}`, {
      userId,
      metadata: { documentIds, targetFolderId, count },
    });
  }

  // ============================================
  // TAG LOGGING
  // ============================================

  tagCreated(tagId: string, userId: string, tagName: string, color: string): void {
    this.log(LogLevel.INFO, LogCategory.TAG, `Tag created: ${tagName}`, {
      userId,
      metadata: { tagId, tagName, color },
    });
  }

  tagUpdated(tagId: string, userId: string, changes: Record<string, any>): void {
    this.log(LogLevel.INFO, LogCategory.TAG, 'Tag updated', {
      userId,
      metadata: { tagId, changes },
    });
  }

  tagDeleted(tagId: string, userId: string, tagName: string): void {
    this.log(LogLevel.INFO, LogCategory.TAG, `Tag deleted: ${tagName}`, {
      userId,
      metadata: { tagId, tagName },
    });
  }

  tagsApplied(documentId: string, userId: string, tagIds: string[], tagCount: number): void {
    this.log(LogLevel.INFO, LogCategory.TAG, `${tagCount} tag(s) applied to document`, {
      documentId,
      userId,
      metadata: { tagIds, tagCount },
    });
  }

  // ============================================
  // STORAGE LOGGING
  // ============================================

  storageQuotaChecked(userId: string, usedBytes: number, limitBytes: number): void {
    if (this.isDevelopment) {
      this.log(LogLevel.DEBUG, LogCategory.STORAGE, 'Storage quota checked', {
        userId,
        metadata: { usedBytes, limitBytes, percentUsed: (usedBytes / limitBytes) * 100 },
      });
    }
  }

  storageQuotaExceeded(userId: string, usedBytes: number, limitBytes: number): void {
    this.log(LogLevel.WARN, LogCategory.STORAGE, 'Storage quota exceeded', {
      userId,
      metadata: { usedBytes, limitBytes },
    });
  }

  fileDeleted(filePath: string, userId: string, fileSize: number): void {
    this.log(LogLevel.INFO, LogCategory.STORAGE, `File deleted from storage: ${filePath}`, {
      userId,
      metadata: { filePath, fileSize },
    });
  }

  // ============================================
  // DATABASE LOGGING
  // ============================================

  databaseQuery(query: string, duration?: number, userId?: string): void {
    if (this.isDevelopment) {
      this.log(LogLevel.DEBUG, LogCategory.DATABASE, 'Database query executed', {
        userId,
        metadata: { query: query.substring(0, 100), duration },
      });
    }
  }

  databaseError(query: string, error: Error | unknown, userId?: string): void {
    this.log(LogLevel.ERROR, LogCategory.DATABASE, 'Database query failed', {
      userId,
      error,
      metadata: { query: query.substring(0, 100) },
    });
  }

  connectionPoolExhausted(): void {
    this.log(LogLevel.CRITICAL, LogCategory.DATABASE, 'Database connection pool exhausted', {
      metadata: { timestamp: new Date().toISOString() },
    });
  }

  // ============================================
  // SUBSCRIPTION/BILLING LOGGING
  // ============================================

  subscriptionCreated(userId: string, plan: string): void {
    this.log(LogLevel.INFO, LogCategory.SUBSCRIPTION, `Subscription created: ${plan}`, {
      userId,
      metadata: { plan },
    });
  }

  subscriptionUpgraded(userId: string, oldPlan: string, newPlan: string): void {
    this.log(LogLevel.INFO, LogCategory.SUBSCRIPTION, `Subscription upgraded: ${oldPlan} → ${newPlan}`, {
      userId,
      metadata: { oldPlan, newPlan },
    });
  }

  subscriptionCancelled(userId: string, plan: string): void {
    this.log(LogLevel.INFO, LogCategory.SUBSCRIPTION, `Subscription cancelled: ${plan}`, {
      userId,
      metadata: { plan },
    });
  }

  subscriptionExpired(userId: string, plan: string): void {
    this.log(LogLevel.WARN, LogCategory.SUBSCRIPTION, `Subscription expired: ${plan}`, {
      userId,
      metadata: { plan },
    });
  }

  // ============================================
  // EMAIL LOGGING
  // ============================================

  emailSent(to: string, subject: string, userId?: string): void {
    this.log(LogLevel.INFO, LogCategory.EMAIL, `Email sent: ${subject}`, {
      userId,
      metadata: { to, subject },
    });
  }

  emailFailed(to: string, subject: string, error: Error | unknown, userId?: string): void {
    this.log(LogLevel.ERROR, LogCategory.EMAIL, `Email failed: ${subject}`, {
      userId,
      error,
      metadata: { to, subject },
    });
  }

  // ============================================
  // USER ACTION LOGGING
  // ============================================

  userAction(
    action: string,
    userId: string,
    documentId?: string,
    metadata?: Record<string, any>
  ): void {
    this.log(LogLevel.INFO, LogCategory.USER_ACTION, `User action: ${action}`, {
      userId,
      documentId,
      metadata,
    });
  }

  searchPerformed(userId: string, query: string, resultsCount: number): void {
    this.log(LogLevel.INFO, LogCategory.USER_ACTION, 'Search performed', {
      userId,
      metadata: { query, resultsCount },
    });
  }

  filterApplied(userId: string, filters: Record<string, any>): void {
    if (this.isDevelopment) {
      this.log(LogLevel.DEBUG, LogCategory.USER_ACTION, 'Filters applied', {
        userId,
        metadata: { filters },
      });
    }
  }

  viewModeChanged(userId: string, viewMode: string): void {
    if (this.isDevelopment) {
      this.log(LogLevel.DEBUG, LogCategory.USER_ACTION, `View mode changed to: ${viewMode}`, {
        userId,
        metadata: { viewMode },
      });
    }
  }

  bulkActionPerformed(userId: string, action: string, itemCount: number, itemIds: string[]): void {
    this.log(LogLevel.INFO, LogCategory.USER_ACTION, `Bulk action: ${action} on ${itemCount} item(s)`, {
      userId,
      metadata: { action, itemCount, itemIds },
    });
  }

  // ============================================
  // API LOGGING
  // ============================================

  apiRequest(endpoint: string, method: string, userId?: string, metadata?: Record<string, any>): void {
    if (this.isDevelopment) {
      this.log(LogLevel.DEBUG, LogCategory.API, `API Request: ${method} ${endpoint}`, {
        userId,
        metadata: { endpoint, method, ...metadata },
      });
    }
  }

  apiResponse(endpoint: string, method: string, statusCode: number, duration?: number, userId?: string): void {
    if (this.isDevelopment) {
      this.log(LogLevel.DEBUG, LogCategory.API, `API Response: ${method} ${endpoint} - ${statusCode}`, {
        userId,
        metadata: { endpoint, method, statusCode, duration },
      });
    }
  }

  apiError(endpoint: string, method: string, error: Error | unknown, userId?: string): void {
    this.log(LogLevel.ERROR, LogCategory.API, `API Error: ${method} ${endpoint}`, {
      userId,
      error,
      metadata: { endpoint, method },
    });
  }

  rateLimitExceeded(endpoint: string, userId?: string): void {
    this.log(LogLevel.WARN, LogCategory.API, `Rate limit exceeded: ${endpoint}`, {
      userId,
      metadata: { endpoint },
    });
  }

  // ============================================
  // SYSTEM LOGGING
  // ============================================

  systemError(message: string, error: Error | unknown, metadata?: Record<string, any>): void {
    this.log(LogLevel.ERROR, LogCategory.SYSTEM, message, {
      error,
      metadata,
    });
  }

  systemWarning(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.WARN, LogCategory.SYSTEM, message, {
      metadata,
    });
  }

  systemInfo(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.INFO, LogCategory.SYSTEM, message, {
      metadata,
    });
  }

  // ============================================
  // CRITICAL ERRORS (requires immediate attention)
  // ============================================

  critical(message: string, error: Error | unknown, metadata?: Record<string, any>): void {
    this.log(LogLevel.CRITICAL, LogCategory.SYSTEM, `CRITICAL: ${message}`, {
      error,
      metadata,
    });
  }

  // ============================================
  // GENERIC LOGGING METHODS
  // ============================================

  debug(category: LogCategory, message: string, metadata?: Record<string, any>): void {
    if (this.isDevelopment) {
      this.log(LogLevel.DEBUG, category, message, { metadata });
    }
  }

  info(category: LogCategory, message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.INFO, category, message, { metadata });
  }

  warn(category: LogCategory, message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.WARN, category, message, { metadata });
  }

  error(
    category: LogCategory,
    message: string,
    error?: Error | unknown,
    metadata?: Record<string, any>
  ): void {
    this.log(LogLevel.ERROR, category, message, { error, metadata });
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Manually flush the log queue to database
   */
  async flush(): Promise<void> {
    await this.flushQueue();
  }

  /**
   * Get current queue size
   */
  getQueueSize(): number {
    return this.logQueue.length;
  }

  /**
   * Clear the log queue (useful for testing)
   */
  clearQueue(): void {
    this.logQueue = [];
  }
}

// Export singleton instance
export const logger = new Logger();
 
/**
 * Server-side function to save logs directly to database
 * This should ONLY be called from API routes or server components
 */
export async function logToDatabase(logs: LogEntry[]): Promise<void> {
  const { createClient } = await import('@supabase/supabase-js');
  
  // Use service role key on server-side
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  const logInserts = logs.map(entry => ({
    timestamp: entry.timestamp,
    level: entry.level,
    category: entry.category,
    message: entry.message,
    user_id: entry.userId || null,
    document_id: entry.documentId || null,
    error_message: entry.error ? String(entry.error) : null,
    stack_trace: entry.stackTrace || null,
    metadata: entry.metadata || null,
  }));

  const { error } = await supabase.from('logs').insert(logInserts);
  
  if (error) {
    throw new Error(`Failed to insert logs: ${error.message}`);
  }
}

// ============================================
// HELPER FUNCTIONS FOR API ROUTES
// ============================================

export function logApiRequest(
  req: Request,
  userId?: string
): void {
  const url = new URL(req.url);
  logger.apiRequest(url.pathname, req.method, userId);
}

export function logApiError(
  req: Request,
  error: Error | unknown,
  userId?: string
): void {
  const url = new URL(req.url);
  logger.apiError(url.pathname, req.method, error, userId);
}

export function logApiResponse(
  req: Request,
  statusCode: number,
  duration?: number,
  userId?: string
): void {
  const url = new URL(req.url);
  logger.apiResponse(url.pathname, req.method, statusCode, duration, userId);
}

// ============================================
// PERFORMANCE MONITORING HELPER
// ============================================

export class PerformanceLogger {
  private startTime: number;
  private operation: string;
  private userId?: string;
  private documentId?: string;

  constructor(operation: string, userId?: string, documentId?: string) {
    this.operation = operation;
    this.userId = userId;
    this.documentId = documentId;
    this.startTime = Date.now();
  }

  end(metadata?: Record<string, any>): void {
    const duration = Date.now() - this.startTime;
    logger.info(LogCategory.SYSTEM, `${this.operation} completed in ${duration}ms`, {
      userId: this.userId,
      documentId: this.documentId,
      duration,
      ...metadata,
    });
  }

  error(error: Error | unknown, metadata?: Record<string, any>): void {
    const duration = Date.now() - this.startTime;
    logger.error(
      LogCategory.SYSTEM,
      `${this.operation} failed after ${duration}ms`,
      error,
      {
        userId: this.userId,
        documentId: this.documentId,
        duration,
        ...metadata,
      }
    );
  }
}