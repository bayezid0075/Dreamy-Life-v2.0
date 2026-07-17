#!/bin/bash
# pgAdmin boot script — imports the Dreamy Life DB server on first startup

/entrypoint.sh &
PGADMIN_PID=$!

# Wait for pgAdmin DB to be ready
echo "[boot] Waiting for pgAdmin to initialize..."
for i in $(seq 1 30); do
  if [ -f /var/lib/pgadmin/pgadmin4.db ]; then
    echo "[boot] pgAdmin DB found."
    break
  fi
  sleep 1
done

sleep 3

# Insert server into pgAdmin's SQLite database
echo "[boot] Importing server connection..."
python3 << 'PYEOF'
import sqlite3
import os
import time

DB_PATH = "/var/lib/pgadmin/pgadmin4.db"

for attempt in range(10):
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        # Check if server already exists
        cursor.execute("SELECT id FROM server WHERE name = 'Dreamy Life DB'")
        if cursor.fetchone():
            print("[boot] Server 'Dreamy Life DB' already exists. Skipping.")
            conn.close()
            break

        # Get admin user id
        cursor.execute("SELECT id FROM user WHERE email = 'admin@dreamy-life.com'")
        row = cursor.fetchone()
        if not row:
            print("[boot] Admin user not found yet. Retrying...")
            conn.close()
            time.sleep(2)
            continue
        user_id = row[0]

        # Check/create server group (id=1 is default "Servers")
        cursor.execute("SELECT id FROM servergroup WHERE user_id = ? AND name = 'Servers'", (user_id,))
        sg = cursor.fetchone()
        if sg:
            servergroup_id = sg[0]
        else:
            cursor.execute("INSERT INTO servergroup (user_id, name) VALUES (?, 'Servers')", (user_id,))
            servergroup_id = cursor.lastrowid

        # Insert the server
        cursor.execute("""
            INSERT INTO server (
                user_id, servergroup_id, name, host, port,
                maintenance_db, username, save_password, shared,
                bgcolor, fgcolor
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 2, 0, NULL, NULL)
        """, (
            user_id, servergroup_id,
            "Dreamy Life DB", "postgres", 5432,
            "dl_data", "Dreamy_life"
        ))

        conn.commit()
        print("[boot] Server 'Dreamy Life DB' imported successfully!")
        conn.close()
        break
    except sqlite3.OperationalError as e:
        if "database is locked" in str(e):
            print(f"[boot] DB locked, retrying ({attempt+1}/10)...")
            time.sleep(2)
        else:
            print(f"[boot] SQLite error: {e}")
            break
    except Exception as e:
        print(f"[boot] Error: {e}")
        time.sleep(2)

PYEOF

echo "[boot] Done."

wait $PGADMIN_PID
