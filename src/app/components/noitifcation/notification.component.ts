import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { INotification, NotificationService, NotificationType } from 'src/app/services/notification.service';

@Component({
    selector: 'app-notification',
    templateUrl: './notification.component.html',
    styleUrls: ['./notification.component.scss']
})
export class NotificationComponent implements OnInit, OnDestroy {

    ns = inject(NotificationService);

    sub: Subscription | null = null;

    notifications: INotification[] = [];

    ngOnInit(): void {
        this.sub = this.ns.notification$.subscribe((notifications) => {
            this.notifications = notifications;
        });
    }

    ngOnDestroy(): void {
        this.sub?.unsubscribe();
    }

    getIconInfo(notification: INotification): { name: string, color: string } {
        switch (notification.type) {
            case NotificationType.Error:
                return { name: 'octBlocked', color: 'red' };
            case NotificationType.Info:
                return { name: 'octInfo', color: 'blue' };
            case NotificationType.Success:
                return { name: 'octCheck', color: 'green' };
            case NotificationType.Warning:
                return { name: 'octAlertFill', color: 'orange' };
            default:
                return { name: 'octInfo', color: 'blue' };
        }
    }

}
