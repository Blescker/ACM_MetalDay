import {
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';
import { GuitarComponent } from '../guitar-component/guitar.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  standalone: true,
  imports: [CommonModule, GuitarComponent],
})
export class MainComponent implements OnInit, OnDestroy {
  escuchando = false;
  nivelVolumen = 0;
  score = 0;
  activarModeloGuitarra = false;
  musicaReproduciendose = true; // ✅ Nueva variable para toggle

  private picoVolumen = 0;
  private audioContext!: AudioContext;
  private analyser!: AnalyserNode;
  private animationId!: number;

  private audioIntro = new Audio('/ironmaiden.mp3');

  ngOnInit(): void {
    this.audioIntro.loop = true;
    this.audioIntro.volume = 0.1;

    this.audioIntro.play().catch(err => {
      console.warn('🎧 Interacción requerida para reproducir audio');
      this.musicaReproduciendose = false;
    });

    const activarPorMouse = () => {
      this.activarModeloGuitarra = true;
      window.removeEventListener('mousemove', activarPorMouse);
    };

    window.addEventListener('mousemove', activarPorMouse, { once: true });
  }

  alternarMusica() {
    if (this.musicaReproduciendose) {
      this.audioIntro.pause();
    } else {
      this.audioIntro.play().catch(err => {
        console.warn('🎵 No se pudo reproducir la música:', err);
      });
    }
    this.musicaReproduciendose = !this.musicaReproduciendose;
  }

  async iniciarGrito() {
    this.escuchando = true;
    this.score = 0;
    this.picoVolumen = 0;

    this.audioIntro.pause();
    this.audioIntro.currentTime = 0;
    this.musicaReproduciendose = false;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();

      this.analyser.fftSize = 256;
      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      source.connect(this.analyser);

      let silencioInicio: number | null = null;

      const actualizarBarra = () => {
        this.analyser.getByteFrequencyData(dataArray);
        const total = dataArray.reduce((a, b) => a + b, 0);
        const promedio = total / bufferLength;

        this.nivelVolumen = Math.min(100, Math.round((promedio / 255) * 100));

        if (this.nivelVolumen > this.picoVolumen) {
          this.picoVolumen = this.nivelVolumen;
        }

        let multiplicador = 5;
        if (this.picoVolumen >= 80) {
          multiplicador = 12;
        } else if (this.picoVolumen >= 50) {
          multiplicador = 8;
        }
        this.score = Math.round(this.picoVolumen * multiplicador);

        const ahora = Date.now();

        if (this.nivelVolumen < 5) {
          if (!silencioInicio) {
            silencioInicio = ahora;
          }

          if (ahora - silencioInicio > 1500) {
            this.score = Math.round(this.picoVolumen * multiplicador);
            this.escuchando = false;

            this.audioContext.close();
            cancelAnimationFrame(this.animationId);

            this.audioIntro.currentTime = 0;
            this.audioIntro.play().then(() => {
              this.musicaReproduciendose = true;
            }).catch(err => {
              console.warn('🎵 Error al reanudar audio:', err);
              this.musicaReproduciendose = false;
            });

            return;
          }

        } else {
          silencioInicio = null;
        }

        this.animationId = requestAnimationFrame(actualizarBarra);
      };

      actualizarBarra();
    } catch (error) {
      console.error('🎙️ Error al acceder al micrófono:', error);
      this.escuchando = false;
    }
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.animationId);
    this.audioContext?.close();
    this.audioIntro.pause();
  }

  get gritoMensaje(): string {
    if (this.score >= 900) return '😈 ¡GRITO DEMONÍACO!';
    if (this.score >= 700) return '🔥 ¡GRITO BRUTAL!';
    if (this.score >= 500) return '💀 ¡GRITO PODEROSO!';
    if (this.score >= 300) return '🤘 ¡GRITO RESPETABLE!';
    if (this.score > 0) return '😐 Grito flojito...';
    return '';
  }
}
