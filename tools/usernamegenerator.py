import argparse
import random
import unidecode

def generate_usernames(name, mode):
    first_name, last_name = name.split()
    first_name = unidecode.unidecode(first_name.lower())
    last_name = unidecode.unidecode(last_name.lower())
    
    usernames = set()
    
    if mode >= 1:
        usernames.add(f"{first_name[0]}{last_name}")  # jsmith
    
    if mode >= 2:
        usernames.update({
            f"{first_name}.{last_name}",  # john.smith
            f"{first_name[0]}.{last_name}",  # j.smith
            f"{last_name}{first_name[0]}",  # smithj
            f"{first_name}{last_name[0]}",  # johns
        })
    
    if mode >= 3:
        usernames.update({
            f"{first_name}{last_name}",  # johnsmith
            f"{first_name}{last_name}{random.randint(1,99)}",  # johnsmith42
            f"{first_name[0]}{last_name}{random.randint(1,99)}",  # jsmith87
            f"{first_name[:3]}{last_name[:4]}",  # johsmit
        })
    
    return usernames

def main():
    parser = argparse.ArgumentParser(description="Générateur d'identifiants utilisateurs")
    parser.add_argument("--mode", type=int, choices=[1, 2, 3], required=True, help="Niveau de complexité des identifiants (1, 2, ou 3)")
    parser.add_argument("--userlist", type=str, required=True, help="Fichier texte contenant la liste des utilisateurs (un par ligne)")
    parser.add_argument("--output", type=str, required=True, help="Fichier de sortie contenant uniquement les identifiants générés")
    args = parser.parse_args()
    
    try:
        with open(args.userlist, "r", encoding="utf-8") as file:
            users = [line.strip() for line in file if line.strip()]
    except FileNotFoundError:
        print(f"Erreur: fichier {args.userlist} introuvable.")
        return
    
    with open(args.output, "w", encoding="utf-8") as output_file:
        for user in users:
            usernames = generate_usernames(user, args.mode)
            for username in usernames:
                output_file.write(f"{username}\n")
    
    print(f"Identifiants générés enregistrés dans {args.output}")
    
if __name__ == "__main__":
    main()
