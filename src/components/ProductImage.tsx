import React from "react";

interface ProductImageProps {
  src?: string | null;
  alt: string;
  className?: string;
}

const ProductImage: React.FC<ProductImageProps> = ({
  src,
  alt,
  className = "w-20 h-20 object-cover rounded-lg",
}) => {
  const fallback =
    "https://i.pinimg.com/1200x/a7/2f/db/a72fdbea7e86c3fb70a17c166a36407b.jpg";

  return <img src={src || fallback} alt={alt} className={className} />;
};

export default ProductImage;
