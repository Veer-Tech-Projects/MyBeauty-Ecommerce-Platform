/**
 * Renders any number of shimmering placeholder cards to match ProductGrid’s layout.
 * Usage: <SkeletonCard count={8} />
 */
export default function SkeletonCard({ count = 8 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div className="col-6 col-sm-4 col-md-3" key={i}>
          <div className="product-card placeholder-glow">
            <div className="prod-img-wrapper placeholder" />

            <p className="placeholder col-10 mt-2" style={{ height: 12 }} />
            <p className="placeholder col-6" style={{ height: 12 }} />
          </div>
        </div>
      ))}
    </>
  );
}
