FROM nginx:alpine

# Copier les fichiers du projet dans le répertoire de travail nginx
COPY . /usr/share/nginx/html/

# Exposer le port 80
EXPOSE 80

# Commande par défaut pour démarrer nginx
CMD ["nginx", "-g", "daemon off;"]

# Métadonnées
LABEL maintainer="Elliot Belt"
LABEL version="1.0"
LABEL description="Pentesting Template Generator - Un outil pour générer des templates de rapports de pentest" 