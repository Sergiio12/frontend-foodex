import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { LoginRequest } from '../model/LoginRequest';
import { Observable } from 'rxjs';
import { SignupRequest } from '../model/SignupRequest';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/api/auth';

  constructor(private http: HttpClient) { }

  authenticate(credentials: LoginRequest) : Observable<any> {
      return this.http.post(`${this.apiUrl}/signin`, credentials)
  }

  register(user: SignupRequest) : Observable<any> {
    return this.http.post(`${this.apiUrl}/signup`, user)
  }

}
