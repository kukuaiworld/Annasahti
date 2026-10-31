import {
  Donation,
  RecipientRequest,
  AnimalFeedLog,
  ProcessorBatch,
  VolunteerTask,
  VolunteerUser,
  UserAccount,
  AuditLog,
} from "../types";
import {
  INITIAL_DONATIONS,
  INITIAL_REQUESTS,
  INITIAL_ANIMAL_LOGS,
  INITIAL_PROCESSOR_BATCHES,
  INITIAL_VOLUNTEER_TASKS,
  INITIAL_VOLUNTEER_USERS,
  INITIAL_USERS,
  INITIAL_AUDIT_LOGS,
} from "../data/demoData";

const STORAGE_KEYS = {
  DONATIONS: "annasathi_donations",
  REQUESTS: "annasathi_requests",
  ANIMAL_LOGS: "annasathi_animal_logs",
  PROCESSOR_BATCHES: "annasathi_processor_batches",
  VOLUNTEER_TASKS: "annasathi_volunteer_tasks",
  VOLUNTEERS: "annasathi_volunteers",
  USERS: "annasathi_users",
  AUDIT_LOGS: "annasathi_audit_logs",
};

class StorageService {
  private isBrowser(): boolean {
    return typeof window !== "undefined";
  }

  private getItem<T>(key: string, defaultValue: T): T {
    if (!this.isBrowser()) return defaultValue;
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private setItem<T>(key: string, value: T): void {
    if (!this.isBrowser()) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
      window.dispatchEvent(new Event("annasathi_storage_update"));
    } catch (e) {
      console.error("Storage error:", e);
    }
  }

  // Donations
  getDonations(): Donation[] {
    return this.getItem<Donation[]>(STORAGE_KEYS.DONATIONS, INITIAL_DONATIONS);
  }

  saveDonations(donations: Donation[]): void {
    this.setItem(STORAGE_KEYS.DONATIONS, donations);
  }

  addDonation(donation: Donation): void {
    const list = this.getDonations();
    const updated = [donation, ...list];
    this.saveDonations(updated);

    this.addAuditLog({
      id: "log-" + Date.now(),
      timestamp: new Date().toISOString(),
      actor: donation.donorName,
      role: "donor",
      action: "DONATION_CREATED",
      details: `New donation created: ${donation.trackingCode} (${donation.totalKg}kg, ${donation.foodItems.map(f => f.name).join(", ")})`,
      ipAddress: "127.0.0.1",
    });
  }

  updateDonation(id: string, partial: Partial<Donation>): void {
    const list = this.getDonations();
    const updated = list.map((item) => (item.id === id ? { ...item, ...partial } : item));
    this.saveDonations(updated);
  }

  getDonationByCode(code: string): Donation | undefined {
    const list = this.getDonations();
    return list.find((d) => d.trackingCode.toLowerCase() === code.trim().toLowerCase() || d.id === code.trim());
  }

  // Requests
  getRequests(): RecipientRequest[] {
    return this.getItem<RecipientRequest[]>(STORAGE_KEYS.REQUESTS, INITIAL_REQUESTS);
  }

  addRequest(req: RecipientRequest): void {
    const list = this.getRequests();
    const updated = [req, ...list];
    this.setItem(STORAGE_KEYS.REQUESTS, updated);

    this.addAuditLog({
      id: "log-" + Date.now(),
      timestamp: new Date().toISOString(),
      actor: req.organizationName,
      role: "recipient",
      action: "FOOD_REQUEST_RAISED",
      details: `Request for ${req.requiredServings} servings (${req.dietaryPreference}) created. Urgency: ${req.urgencyLevel}`,
      ipAddress: "127.0.0.1",
    });
  }

  updateRequest(id: string, partial: Partial<RecipientRequest>): void {
    const list = this.getRequests();
    const updated = list.map((item) => (item.id === id ? { ...item, ...partial } : item));
    this.setItem(STORAGE_KEYS.REQUESTS, updated);
  }

  // Animal Logs
  getAnimalLogs(): AnimalFeedLog[] {
    return this.getItem<AnimalFeedLog[]>(STORAGE_KEYS.ANIMAL_LOGS, INITIAL_ANIMAL_LOGS);
  }

  addAnimalLog(log: AnimalFeedLog): void {
    const list = this.getAnimalLogs();
    this.setItem(STORAGE_KEYS.ANIMAL_LOGS, [log, ...list]);
  }

  // Processor Batches
  getProcessorBatches(): ProcessorBatch[] {
    return this.getItem<ProcessorBatch[]>(STORAGE_KEYS.PROCESSOR_BATCHES, INITIAL_PROCESSOR_BATCHES);
  }

  addProcessorBatch(batch: ProcessorBatch): void {
    const list = this.getProcessorBatches();
    this.setItem(STORAGE_KEYS.PROCESSOR_BATCHES, [batch, ...list]);
  }

  // Volunteer Tasks
  getVolunteerTasks(): VolunteerTask[] {
    return this.getItem<VolunteerTask[]>(STORAGE_KEYS.VOLUNTEER_TASKS, INITIAL_VOLUNTEER_TASKS);
  }

  updateVolunteerTask(id: string, partial: Partial<VolunteerTask>): void {
    const list = this.getVolunteerTasks();
    const updated = list.map((item) => (item.id === id ? { ...item, ...partial } : item));
    this.setItem(STORAGE_KEYS.VOLUNTEER_TASKS, updated);
  }

  // Volunteers Leaderboard
  getVolunteers(): VolunteerUser[] {
    return this.getItem<VolunteerUser[]>(STORAGE_KEYS.VOLUNTEERS, INITIAL_VOLUNTEER_USERS);
  }

  // Users
  getUsers(): UserAccount[] {
    return this.getItem<UserAccount[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
  }

  updateUserVerification(userId: string, status: "verified" | "rejected"): void {
    const list = this.getUsers();
    const updated = list.map((u) => (u.id === userId ? { ...u, verificationStatus: status } : u));
    this.setItem(STORAGE_KEYS.USERS, updated);
  }

  // Audit Logs
  getAuditLogs(): AuditLog[] {
    return this.getItem<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
  }

  addAuditLog(log: AuditLog): void {
    const list = this.getAuditLogs();
    this.setItem(STORAGE_KEYS.AUDIT_LOGS, [log, ...list]);
  }

  // Reset to default demo data
  resetDemoData(): void {
    if (!this.isBrowser()) return;
    localStorage.removeItem(STORAGE_KEYS.DONATIONS);
    localStorage.removeItem(STORAGE_KEYS.REQUESTS);
    localStorage.removeItem(STORAGE_KEYS.ANIMAL_LOGS);
    localStorage.removeItem(STORAGE_KEYS.PROCESSOR_BATCHES);
    localStorage.removeItem(STORAGE_KEYS.VOLUNTEER_TASKS);
    localStorage.removeItem(STORAGE_KEYS.VOLUNTEERS);
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS);
    window.dispatchEvent(new Event("annasathi_storage_update"));
  }
}

export const storageService = new StorageService();
