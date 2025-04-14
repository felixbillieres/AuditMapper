    #### Analyse et Exploitation

    **Contexte Initial :**
    Le serveur web `{{hostname}}` ({{ip}}), identifié comme étant de type **{{type}}**, a été analysé le {{date}}.
    Les services suivants ont été détectés : {{services_detected}}.
    {{services_context}} Les services HTTP/HTTPS sont les points d'entrée principaux. L'analyse se concentre sur les vulnérabilités applicatives et la configuration du serveur web.

    **Accès et Compromission :**
    {{credentials_summary}}
    {{credentials_list}} (Peuvent concerner l'application, le serveur, ou une base de données liée)
    L'accès initial a potentiellement été obtenu via {{access_vector}} (ex: injection SQL, RCE via upload, XSS stockée, mauvaise configuration). La technique d'exploitation principale employée ou envisagée est {{exploitation_technique}}.

    **Élévation de Privilèges :**
    Les possibilités d'élévation de privilèges sur le système hébergeant le service web incluent potentiellement {{privesc_technique}} (dépendant de l'OS sous-jacent - voir templates Windows/Linux). L'objectif peut aussi être d'obtenir des accès privilégiés sur l'application elle-même ou la base de données.

    **Mouvement Latéral / Pivot :**
    {{pivots_summary}} Un serveur web compromis peut servir de pivot pour atteindre des réseaux internes, des bases de données, ou d'autres serveurs via des connexions établies ou des vulnérabilités SSRF.
    {{pivots_list}}

    **Observations et Notes Spécifiques :**
    {{notes}} (ex: Technologie utilisée - PHP, Java, Node.js; CMS spécifique; API exposée)

    **Synthèse pour cet Hôte :**
    {{host_summary}} (ex: Serveur web compromis avec accès initial, Point d'entrée vers le réseau interne)

    ---