export const translations = {
  en: {
    accountUpdatedSuccess: "Account updated successfully!",
    passwordChangedSuccess: "Password changed successfully!",
    privacyUpdatedSuccess: "Privacy settings updated!",
    twoFactorEnabledSuccess: "2FA enabled!",
    twoFactorDisabledSuccess: "2FA disabled!",
    notificationsSavedSuccess: "Notification preferences saved!",
    displaySettingsUpdatedSuccess: "Display settings updated!",
    passwordsDoNotMatch: "Passwords do not match!",
    passwordMust8Chars: "Password must be at least 8 characters",
    networkError: "Network error occurred",
  },
  es: {
    accountUpdatedSuccess: "¡Cuenta actualizada con éxito!",
    passwordChangedSuccess: "¡Contraseña cambiada con éxito!",
    privacyUpdatedSuccess: "¡Configuración de privacidad actualizada!",
    twoFactorEnabledSuccess: "¡2FA habilitado!",
    twoFactorDisabledSuccess: "¡2FA deshabilitado!",
    notificationsSavedSuccess: "¡Preferencias de notificación guardadas!",
    displaySettingsUpdatedSuccess: "¡Configuración de pantalla actualizada!",
    passwordsDoNotMatch: "¡Las contraseñas no coinciden!",
    passwordMust8Chars: "La contraseña debe tener al menos 8 caracteres",
    networkError: "Ocurrió un error de red",
  },
  fr: {
    accountUpdatedSuccess: "Compte mis à jour avec succès!",
    passwordChangedSuccess: "Mot de passe changé avec succès!",
    privacyUpdatedSuccess: "Paramètres de confidentialité mis à jour!",
    twoFactorEnabledSuccess: "2FA activé!",
    twoFactorDisabledSuccess: "2FA désactivé!",
    notificationsSavedSuccess: "Préférences de notification enregistrées!",
    displaySettingsUpdatedSuccess: "Paramètres d'affichage mis à jour!",
    passwordsDoNotMatch: "Les mots de passe ne correspondent pas!",
    passwordMust8Chars: "Le mot de passe doit contenir au moins 8 caractères",
    networkError: "Une erreur réseau s'est produite",
  },
  de: {
    accountUpdatedSuccess: "Konto erfolgreich aktualisiert!",
    passwordChangedSuccess: "Passwort erfolgreich geändert!",
    privacyUpdatedSuccess: "Datenschutzeinstellungen aktualisiert!",
    twoFactorEnabledSuccess: "2FA aktiviert!",
    twoFactorDisabledSuccess: "2FA deaktiviert!",
    notificationsSavedSuccess: "Benachrichtigungseinstellungen gespeichert!",
    displaySettingsUpdatedSuccess: "Anzeigeeinstellungen aktualisiert!",
    passwordsDoNotMatch: "Passwörter stimmen nicht überein!",
    passwordMust8Chars: "Passwort muss mindestens 8 Zeichen lang sein",
    networkError: "Netzwerkfehler aufgetreten",
  },
};

export function useTranslation(lang: 'en' | 'es' | 'fr' | 'de' = 'en') {
  const t = (key: string): string => {
    const keys = key.split('.');
    let value: string | Record<string, string> = translations[lang];
    
    for (const k of keys) {
      if (typeof value === 'object' && value !== null) {
        value = value[k];
      }
    }
    
    return typeof value === 'string' ? value : key;
  };
  
  return { t };
}