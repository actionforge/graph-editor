import { Component } from '@angular/core';
import { OnInit } from '@angular/core';
import packageJson from '../../package.json';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {

  title = location.hostname;
  appVersion = packageJson.version;

  ngOnInit(): void {
    const theme = window.localStorage.getItem('theme');
    if (theme === 'dark' || !theme) {
      document.documentElement.classList.add('dark');
    }
  }

  onClickToggleTheme(_event: MouseEvent): void {
    if (document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.remove('dark');
      window.localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      window.localStorage.setItem('theme', 'dark');
    }
  }
}
