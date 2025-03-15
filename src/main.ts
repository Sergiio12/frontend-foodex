import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideRouter } from '@angular/router'; // Para configurar rutas
import { provideHttpClient } from '@angular/common/http'; // Si necesitas HttpClient
import { provideAnimations } from '@angular/platform-browser/animations'; // Si usas animaciones
import { importProvidersFrom } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome'; // Para FontAwesome
import { routes } from './app/app.routes'; // Importa tus rutas

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes), // Configura las rutas
    provideHttpClient(), // Proporciona HttpClient
    provideAnimations(), // Proporciona animaciones
    importProvidersFrom(FontAwesomeModule), // Proporciona FontAwesome
  ],
}).catch((err) => console.error(err));