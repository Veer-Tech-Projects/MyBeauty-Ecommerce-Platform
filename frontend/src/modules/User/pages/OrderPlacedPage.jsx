import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from "@/shared/context/CartContext";
import confetti from 'canvas-confetti';
import "@/app/styles/OrderPlaced.css";
import 'bootstrap-icons/font/bootstrap-icons.css';

export default function OrderPlaced() {
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const audioRef = useRef(null);

  /* trigger effects once */
  useEffect(() => {
    clearCart();

    /* play chime */
    audioRef.current?.play().catch(() => {
      /* some browsers block autoplay until user interaction */
      console.log('Sound will play on first click.');
    });

    /* confetti burst for 2 s */
    const end = Date.now() + 2000;
    const frame = () => {
      confetti({ startVelocity: 40, spread: 360, ticks: 70, particleCount: 14, origin: { x: Math.random() * 0.1, y: 0 } });
      confetti({ startVelocity: 40, spread: 360, ticks: 70, particleCount: 14, origin: { x: 1 - Math.random() * 0.1, y: 0 } });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, []);

  return (
    <div className="op-wrapper d-flex align-items-center justify-content-center">

      {/* audio tag (hidden) */}
      <audio ref={audioRef} src="public/sounds/success.mp3" preload="auto" />

      {/* confirmation card */}
      <div className="op-card text-center shadow-lg">

        <h2 className="text-success fw-bold mb-3">🎉 Order Placed!</h2>
        <p className="text-muted mb-4">
          <strong>Your payment was successful.</strong><br /><strong>Thank you for shopping with us.</strong>
        </p>
        <button
          className="btn btn-success px-4 fw-semibold "
          onClick={() => navigate('/')}
        >
           <i className="bi bi-bag"></i> Continue Shopping
        </button>
      </div>
    </div>
  );
}
