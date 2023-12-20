import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

export enum NotificationType {
  Success = 'success',
  Error = 'error',
  Info = 'info',
  Warning = 'warning'
}

export interface INotification {
  type: NotificationType;
  message: string;
}

const DEFAULT_TIMEOUT = 3000;

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationQueue: INotification[] = [];
  private notificationSubject = new BehaviorSubject<INotification[]>([]);

  public notification$ = this.notificationSubject.asObservable();

  showNotification(type: NotificationType, message: string, opts?: {
    timeout?: number;
  }) {
    const notification: INotification = { type, message };

    // Remove notifications after n-seconds
    setTimeout(() => {
      this.notificationQueue = this.notificationQueue.filter(n => n !== notification);
      this.notificationSubject.next([...this.notificationQueue]);
    }, opts?.timeout ?? DEFAULT_TIMEOUT);

    this.notificationQueue.push(notification);
    this.notificationSubject.next([...this.notificationQueue]); // Emit a new copy of the queue
  }

  clearNotification(notification: INotification) {
    const index = this.notificationQueue.indexOf(notification);
    if (index !== -1) {
      this.notificationQueue.splice(index, 1);
      this.notificationSubject.next([...this.notificationQueue]); // Emit a new copy of the queue
    }
  }
}