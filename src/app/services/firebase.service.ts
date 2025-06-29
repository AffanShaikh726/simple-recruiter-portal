import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, Auth, UserCredential, onAuthStateChanged } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL, UploadResult } from 'firebase/storage';
import { environment } from '../../environments/environment';
import { BehaviorSubject, Observable, from } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private auth: Auth;
  private storage: any;
  private isAuthenticatedSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  
  constructor() {
    const app = initializeApp(environment.firebase);
    this.auth = getAuth(app);
    this.storage = getStorage(app);
    
    // Check authentication state changes
    onAuthStateChanged(this.auth, (user) => {
      this.isAuthenticatedSubject.next(!!user);
    });
  }
  
  // Authentication methods
  register(email: string, password: string): Observable<UserCredential> {
    return from(createUserWithEmailAndPassword(this.auth, email, password));
  }
  
  login(email: string, password: string): Observable<UserCredential> {
    return from(signInWithEmailAndPassword(this.auth, email, password));
  }
  
  logout(): Observable<void> {
    return from(signOut(this.auth));
  }
  
  get isAuthenticated(): Observable<boolean> {
    return this.isAuthenticatedSubject.asObservable();
  }
  
  get currentUser() {
    return this.auth.currentUser;
  }
  
  // Storage methods
  uploadFile(file: File, path: string): Observable<UploadResult> {
    const storageRef = ref(this.storage, path);
    return from(uploadBytes(storageRef, file));
  }
  
  getFileUrl(path: string): Observable<string> {
    const storageRef = ref(this.storage, path);
    return from(getDownloadURL(storageRef));
  }
}
