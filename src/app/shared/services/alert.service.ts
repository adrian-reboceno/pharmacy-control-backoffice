import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

@Injectable({ providedIn: 'root' })
export class AlertService {

  private readonly baseConfig = {
    confirmButtonColor: '#405189',
    cancelButtonColor:  '#6c757d',
    buttonsStyling:     true,
    customClass: {
      popup:         'pc-swal-popup',
      confirmButton: 'pc-swal-confirm',
      cancelButton:  'pc-swal-cancel',
    },
  };

  private toastInstance = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3500,
    timerProgressBar: true,
    customClass: { popup: 'pc-swal-toast' },
    didOpen: (el) => {
      el.addEventListener('mouseenter', Swal.stopTimer);
      el.addEventListener('mouseleave', Swal.resumeTimer);
    },
  });

  error(message: string, title = 'Error') {
    return Swal.fire({
      ...this.baseConfig,
      icon:  'error',
      title,
      text:  message,
      confirmButtonText: 'Entendido',
    });
  }

  success(message: string, title = 'Éxito') {
    return Swal.fire({
      ...this.baseConfig,
      icon:  'success',
      title,
      text:  message,
      timer: 2000,
      timerProgressBar: true,
      showConfirmButton: false,
    });
  }

  warning(message: string, title = 'Atención') {
    return Swal.fire({
      ...this.baseConfig,
      icon:  'warning',
      title,
      text:  message,
      confirmButtonText: 'Entendido',
    });
  }

  info(message: string, title = 'Información') {
    return Swal.fire({
      ...this.baseConfig,
      icon: 'info',
      title,
      text: message,
      confirmButtonText: 'Entendido',
    });
  }

  confirm(message: string, title = '¿Estás seguro?'): Promise<boolean> {
    return Swal.fire({
      ...this.baseConfig,
      icon:  'warning',
      title,
      text:  message,
      showCancelButton:  true,
      confirmButtonText: 'Sí, continuar',
      cancelButtonText:  'Cancelar',
      reverseButtons:    true,
    }).then(result => result.isConfirmed);
  }

  confirmDelete(itemName: string): Promise<boolean> {
    return Swal.fire({
      ...this.baseConfig,
      icon:  'warning',
      title: '¿Desactivar registro?',
      text:  `${itemName} será marcado como inactivo. Podrás reactivarlo después.`,
      showCancelButton:  true,
      confirmButtonText: 'Sí, desactivar',
      cancelButtonText:  'Cancelar',
      confirmButtonColor: '#f06548',
      reverseButtons:    true,
    }).then(result => result.isConfirmed);
  }

  /** Toast no intrusivo — esquina superior derecha, auto-cierra */
  toast(message: string, icon: 'success' | 'info' | 'warning' | 'error' = 'success') {
    this.toastInstance.fire({ icon, title: message });
  }

  loading(message = 'Procesando...') {
    Swal.fire({
      ...this.baseConfig,
      title: message,
      allowOutsideClick: false,
      allowEscapeKey:    false,
      showConfirmButton: false,
      didOpen: () => Swal.showLoading(),
    });
  }

  close() {
    Swal.close();
  }
}
