import 'bootstrap/dist/css/bootstrap.min.css';
import "@/app/styles/FullScreenSpinner.css";


export default function FullScreenSpinner() {
  return (
    <div className="fs-spinner-overlay">
      <img
        src="/assets/bangle-spinner.png"
        alt="Loading…"
        className="bangle-rotate"
        width={140}
        height={140}
      />
    </div>
  );
}
