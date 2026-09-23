import wenner from '../assets/img/wenner.png'
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../app/hooks";

const Logo = ({
  className = "flex items-center justify-center ",
  imgClassName = "h-9 w-auto mb-3 mt-3",
  alt = "Wenner Logo",
}) => {
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.user.user);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    // Redirecionar baseado no role do usuário
    if (user?.role === "admin") {
      navigate("/admin");
    } else {
      navigate("/");
    }
  };

  return (
    <a href="#" onClick={handleClick} className={className}>
      <img src={wenner} alt={alt} className={imgClassName} />
    </a>
  );
};

export default Logo;
