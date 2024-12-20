

// Initialise la base de données 
function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('UserDatabase', 3);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('users')) {
        db.createObjectStore('users', { keyPath: 'email' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Interface utilisateur
interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  profileImage?: string; // Photo de profil (base64)
}

// Ajoute un utilisateur dans IndexedDB
async function addUser(user: User): Promise<void> {
  const db = await initDB();
  const transaction = db.transaction('users', 'readwrite');
  const store = transaction.objectStore('users');

  store.add(user);

  transaction.oncomplete = () => console.log("Utilisateur ajouté avec succès !");
  transaction.onerror = () => console.error("Erreur lors de l'ajout de l'utilisateur");
}

// Capture une photo avec la caméra
function startCamera() {
  const video = document.getElementById('camera') as HTMLVideoElement;
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;
  const context = canvas.getContext('2d');

  navigator.mediaDevices.getUserMedia({ video: true })
    .then((stream) => {
      video.srcObject = stream;
      video.play();
    })
    .catch((error) => {
      console.error("Erreur lors de l'accès à la caméra :", error);
      alert("Impossible d'accéder à la caméra.");
    });

  document.getElementById('captureButton')?.addEventListener('click', () => {
    context?.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL('image/png'); // Convertit en base64
    (document.getElementById('profileImage') as HTMLInputElement).value = imageData;

    // Afficher l'image capturée
    const profileImageDisplay = document.getElementById('profileImageDisplay') as HTMLImageElement;
    profileImageDisplay.src = imageData;
  });
}

// Setup Drag and Drop avec HTML Drag and Drop API
function setupDragAndDrop() {
  const dropZone = document.getElementById('dropZone') as HTMLDivElement;
  const profileImageInput = document.getElementById('profileImage') as HTMLInputElement;
  const profileImageDisplay = document.getElementById('profileImageDisplay') as HTMLImageElement;

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('bg-gray-200');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('bg-gray-200');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('bg-gray-200');

    const file = e.dataTransfer?.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        profileImageInput.value = reader.result as string;
        profileImageDisplay.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    } else {
      alert("Veuillez déposer un fichier image valide.");
    }
  });
}

// Fonction pour vérifier si les mots de passe correspondent
function validatePassword() {
  const password = (document.getElementById('password') as HTMLInputElement).value;
  const confirmPassword = (document.getElementById('confirmpassword') as HTMLInputElement).value;
  const errorElement = document.getElementById('passwordError') as HTMLElement;

  if (password !== confirmPassword) {
    errorElement.classList.remove('hidden');
    return false;
  } else {
    errorElement.classList.add('hidden');
    return true;
  }
}

function isTermsAccepted(): boolean {
  const termsCheckbox = document.getElementById('termsCheckbox') as HTMLInputElement;
  return termsCheckbox.checked;
}


// Gestionnaire d'événements pour l'inscription
document.getElementById('registerForm')?.addEventListener('submit', async (event) => {
  event.preventDefault();

  // Vérifie si les mots de passe correspondent
  if (!validatePassword()) {
    return; // Si les mots de passe ne correspondent pas, ne soumettez pas le formulaire
  }

  // Vérifie si l'utilisateur a accepté les termes et conditions
  if (!isTermsAccepted()) {
    alert("Vous devez accepter les termes et conditions.");
    return; // Ne soumettez pas le formulaire si les termes ne sont pas acceptés
  }

  const username = (document.getElementById('username') as HTMLInputElement).value;
  const email = (document.getElementById('email') as HTMLInputElement).value;
  const password = (document.getElementById('password') as HTMLInputElement).value;
  const profileImage = (document.getElementById('profileImage') as HTMLInputElement).value;

  const userId = crypto.randomUUID();

  const user: User = { id: userId, username, email, password, profileImage };

  try {
    await addUser(user);
    alert("Utilisateur inscrit avec succès !");
    window.location.href = 'login.html';

  } catch (error) {
    alert("Erreur lors de l'inscription. Cet email existe peut-être déjà.");
  }
});

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
  startCamera();
  setupDragAndDrop();
});


function handleCredentialResponse(response: any) {
  console.log("Encoded JWT ID token: " + response.credential);

  // Decode the JWT to extract user information (e.g., email, name)
  const userToken = response.credential;
  const base64Url = userToken.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const decodedData = JSON.parse(atob(base64));

  const user: User = {
    id: crypto.randomUUID(),
    username: decodedData.name,
    email: decodedData.email,
    password: '', // Pas besoin de mot de passe pour les connexions via Gmail
    profileImage: decodedData.picture, // Utiliser l'image de profil Google
  };

  addUser(user)
    .then(() => {
      if (user) {
        // Stocke l'ID utilisateur dans le Local Storage
        localStorage.setItem('idUser', user.id);
        localStorage.setItem('userName', user.username);
        alert("Connexion réussie !");
        
        window.location.href = "about.html"; // Redirige vers la page About
      }
      alert(`Utilisateur ${decodedData.name} enregistré avec succès !`);
      window.location.href = 'about.html'; // Redirige vers le tableau de bord
    })
    .catch((error) => {
      console.error('Erreur lors de l\'enregistrement de l\'utilisateur Google :', error);
      alert('Erreur lors de l\'enregistrement.');
    });

  console.log("User info:", decodedData);

  // Use this information (e.g., save it in IndexedDB or start a session)

}

// Ensure this function is available globally for the Google API to call
(window as any).handleCredentialResponse = handleCredentialResponse;
declare const FB: any; // Declare FB if TypeScript complains

function facebookLogin() {
  console.log('aaaaa');
  FB.login((response: any) => {
    if (response.authResponse) {
      console.log('Welcome! Fetching your information...');

      FB.api('/me', { fields: 'id,name,email,picture' }, async (userInfo: any) => {
        console.log('User info:', userInfo);

        // Example of processing user info
        const user = {
          id: userInfo.id,
          username: userInfo.name,
          email: userInfo.email,
          profileImage: userInfo.picture.data.url,
        };

        console.log('Logged in user:', user);

        // Optional: Save user info to your database or localStorage
        localStorage.setItem('idUser', user.id);
        localStorage.setItem('userName', user.username);
        alert('Connexion réussie avec Facebook !');

        // Redirect to another page
        window.location.href = 'about.html';
      });
    } else {
      console.error('User cancelled login or did not fully authorize.');
      alert('Connexion Facebook échouée.');
    }
  }, { scope: 'public_profile,email' }); // Request these permissions
}

// Ensure the function is globally accessible
(window as any).facebookLogin = facebookLogin;
