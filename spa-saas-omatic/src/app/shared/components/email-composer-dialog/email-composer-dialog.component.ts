import {
  AfterViewInit,
  Component,
  ElementRef,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatePipe } from '../../pipes/translate.pipe';

export interface EmailComposerDialogData {
  recipient: string;
  recipientName?: string;
  subtitle?: string;
  subject?: string;
  body?: string;
  bodyHtml?: string;
}

/**
 * Universal, modular enterprise dialog for composing, formatting, and dispatching
 * commercial proposals or communications.
 * Incorporates a lightweight, native HTML5 contenteditable rich-text editor (zero third-party bloat)
 * supporting Multi-MIME clipboard copying (rich HTML + text) and RFC 6068 mailto URI generation.
 */
@Component({
  selector: 'app-email-composer-dialog',
  imports: [
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatTooltipModule,
    TranslatePipe,
  ],
  templateUrl: './email-composer-dialog.component.html',
  styleUrl: './email-composer-dialog.component.scss',
})
export class EmailComposerDialogComponent implements AfterViewInit {
  readonly data = inject<EmailComposerDialogData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<EmailComposerDialogComponent>);

  @ViewChild('editorRef') editorRef?: ElementRef<HTMLDivElement>;

  readonly recipient = signal<string>(this.data.recipient || '');
  readonly subject = signal<string>(this.data.subject || '');
  readonly bodyHtml = signal<string>(this.initBodyHtml());
  readonly copied = signal<boolean>(false);

  private initBodyHtml(): string {
    if (this.data.bodyHtml) {
      return this.data.bodyHtml;
    }
    if (this.data.body) {
      return this.data.body
        .split('\n\n')
        .map((p) => `<p>${p.replace(/\n/g, '<br>')}</p>`)
        .join('');
    }
    return '';
  }

  ngAfterViewInit(): void {
    if (this.editorRef?.nativeElement) {
      this.editorRef.nativeElement.innerHTML = this.bodyHtml();
    }
  }

  onEditorInput(): void {
    if (this.editorRef?.nativeElement) {
      this.bodyHtml.set(this.editorRef.nativeElement.innerHTML);
    }
  }

  format(command: string, value?: string): void {
    if (typeof document !== 'undefined') {
      document.execCommand(command, false, value);
      if (this.editorRef?.nativeElement) {
        this.editorRef.nativeElement.focus();
        this.bodyHtml.set(this.editorRef.nativeElement.innerHTML);
      }
    }
  }

  getPlainText(): string {
    if (this.editorRef?.nativeElement) {
      return this.editorRef.nativeElement.innerText || '';
    }
    if (typeof document !== 'undefined') {
      const temp = document.createElement('div');
      temp.innerHTML = this.bodyHtml();
      return temp.innerText || temp.textContent || '';
    }
    return this.bodyHtml().replace(/<[^>]*>/g, '');
  }

  async copyTemplate(): Promise<void> {
    const plainText = `Subject: ${this.subject()}\n\n${this.getPlainText()}`;
    const htmlText = `<h3>${this.subject()}</h3>${this.bodyHtml()}`;

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        if (typeof ClipboardItem !== 'undefined') {
          const textBlob = new Blob([plainText], { type: 'text/plain' });
          const htmlBlob = new Blob([htmlText], { type: 'text/html' });
          await navigator.clipboard.write([
            new ClipboardItem({
              'text/plain': textBlob,
              'text/html': htmlBlob,
            }),
          ]);
        } else {
          await navigator.clipboard.writeText(plainText);
        }
        this.copied.set(true);
        setTimeout(() => this.copied.set(false), 2500);
      } catch {
        await navigator.clipboard.writeText(plainText);
        this.copied.set(true);
        setTimeout(() => this.copied.set(false), 2500);
      }
    }
  }

  readonly mailtoUri = computed(() => {
    const to = this.recipient().trim();
    const subjectParam = encodeURIComponent(this.subject());
    const plain = this.getPlainText()
      .replace(/\r\n/g, '\n')
      .replace(/\n/g, '\r\n');
    const bodyParam = encodeURIComponent(plain);
    return `mailto:${to}?subject=${subjectParam}&body=${bodyParam}`;
  });

  onMailtoDispatch(): void {
    setTimeout(() => {
      this.dialogRef.close('dispatched');
    }, 400);
  }

  openMailClient(): void {
    const uri = this.mailtoUri();

    if (typeof document !== 'undefined') {
      const link = document.createElement('a');
      link.href = uri;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (typeof window !== 'undefined') {
      window.location.href = uri;
    }

    setTimeout(() => {
      this.dialogRef.close('dispatched');
    }, 400);
  }

  openGmailWeb(): void {
    const to = encodeURIComponent(this.recipient().trim());
    const su = encodeURIComponent(this.subject());
    const body = encodeURIComponent(this.getPlainText());
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${su}&body=${body}`;

    if (typeof window !== 'undefined') {
      window.open(gmailUrl, '_blank', 'noopener,noreferrer');
    }

    this.dialogRef.close('dispatched');
  }

  close(): void {
    this.dialogRef.close();
  }
}
