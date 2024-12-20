declare module '@emailjs/browser' {
    export function init(userId: string): void;
    export function send(serviceId: string, templateId: string, templateParams: object, userId: string): Promise<any>;
    export function sendForm(serviceId: string, templateId: string, formElement: HTMLFormElement, userId: string): Promise<any>;
  }
  