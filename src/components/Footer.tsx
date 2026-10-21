import React from "react";
import { Link } from "react-router-dom";
import { Instagram, Facebook, Twitter, Mail, Phone, MapPin } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-secondary/50 text-foreground pt-12 pb-8 mt-auto">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          
          {/* Sobre a Marca */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold tracking-wider text-foreground">WENNER</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              O que precisas, num só lugar. As melhores peças de roupa, calçado e acessórios com qualidade garantida.
            </p>
            <div className="flex items-center space-x-3 pt-1">
              <a href="#" aria-label="Instagram" className="text-muted-foreground hover:text-foreground transition-colors">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="#" aria-label="Facebook" className="text-muted-foreground hover:text-foreground transition-colors">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="#" aria-label="Twitter" className="text-muted-foreground hover:text-foreground transition-colors">
                <Twitter className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Navegação */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">Navegação</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/" className="hover:text-foreground transition-colors">Início</Link>
              </li>
              <li>
                <Link to="/profile" className="hover:text-foreground transition-colors">Minha Conta</Link>
              </li>
              <li>
                <Link to="/notificacoes" className="hover:text-foreground transition-colors">Notificações</Link>
              </li>
              <li>
                <Link to="/avaliacoes" className="hover:text-foreground transition-colors">Avaliações</Link>
              </li>
            </ul>
          </div>

          {/* Apoio ao Cliente */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">Apoio ao Cliente</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>+258 83 33 40 885</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>suporte@wenner.com</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>Maputo, Mozambique</span>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">Novidades</h4>
            <p className="text-sm text-muted-foreground">
              Subscreve para receberes novidades e descontos exclusivos.
            </p>
            <form onSubmit={(e) => e.preventDefault()} className="space-y-2">
              <input
                type="email"
                placeholder="O teu e-mail"
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <button
                type="submit"
                className="w-full bg-primary text-primary-foreground font-medium py-2 rounded-md text-sm hover:bg-primary/90 transition-colors cursor-pointer"
              >
                Subscrever
              </button>
            </form>
          </div>

        </div>

        {/* Linha Divisória e Copyright */}
        <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Wenner. Todos os direitos reservados.</p>
          <div className="flex space-x-6 mt-3 sm:mt-0">
            <a href="#" className="hover:text-foreground transition-colors">Política de Privacidade</a>
            <a href="#" className="hover:text-foreground transition-colors">Termos e Condições</a>
          </div>
        </div>
      </div>
    </footer>
  );
};