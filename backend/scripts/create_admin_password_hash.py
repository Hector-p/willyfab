import getpass

from app.core.security import hash_password


def main() -> None:
    password = getpass.getpass("Admin password: ")
    confirmation = getpass.getpass("Repeat password: ")
    if password != confirmation:
        raise SystemExit("The passwords do not match.")
    if len(password) < 12:
        raise SystemExit("Use at least 12 characters.")
    print("Set this as ADMIN_PASSWORD_HASH in backend/.env:")
    print(hash_password(password))


if __name__ == "__main__":
    main()
