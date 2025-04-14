    #### Analyse et Exploitation

    **Contexte Initial :**
    L'hôte `{{hostname}}` ({{ip}}), identifié comme un composant clé de l'environnement **Active Directory** (Type: {{type}}), a été analysé le {{date}}.
    Les services suivants ont été détectés : {{services_detected}}.
    {{services_context}} Les services critiques comme Kerberos (port 88), LDAP/LDAPS (389/636), et SMB (445) sont centraux pour les opérations AD et constituent des cibles privilégiées.

    **Accès et Compromission :**
    {{credentials_summary}}
    {{credentials_list}}
    L'accès initial à cet élément AD (ou l'obtention d'informations/credentials le concernant) a potentiellement été obtenu via {{access_vector}} (ex: LLMNR/NBT-NS poisoning, Kerberoasting, AS-REP Roasting, exploitation d'une machine jointe). La technique d'exploitation principale employée ou envisagée est {{exploitation_technique}} (ex: Pass-the-Ticket, DCSync, modification d'ACL, abus de GPO).

    **Élévation de Privilèges (au sein du domaine) :**
    Les possibilités d'élévation de privilèges au sein du domaine via cet hôte ou les informations récoltées incluent potentiellement {{privesc_technique}} (ex: exploitation de relations de confiance inter-domaines, abus de privilèges délégués, ciblage de comptes à privilèges).

    **Mouvement Latéral / Pivot :**
    {{pivots_summary}} Le mouvement latéral en environnement AD est facilité par l'authentification centralisée. Les techniques incluent l'utilisation de tickets Kerberos, de hashs NTLM, ou l'exploitation de services comme WinRM/SMB avec des comptes compromis.
    {{pivots_list}}

    **Observations et Notes Spécifiques :**
    {{notes}} (ex: Contrôleur de domaine, serveur ADFS, serveur CA, etc.)

    **Synthèse pour cet Hôte :**
    {{host_summary}} (ex: Contrôleur de domaine compromis, Accès privilégié obtenu sur le domaine)

    ---