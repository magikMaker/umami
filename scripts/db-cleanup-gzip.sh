#!/bin/bash

# Umami Database Cleanup Script
# Removes old analytics data based on retention period

set -e

DB_NAME="umami"
BACKUP_DIR="$HOME"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}     Umami Database Cleanup Script     ${NC}"
echo -e "${BLUE}========================================${NC}"
echo

# Check if running as root or can access postgres
if ! sudo -u postgres psql -c "SELECT 1" &>/dev/null; then
    echo -e "${RED}Error: Cannot connect to PostgreSQL. Are you running with sufficient privileges?${NC}"
    exit 1
fi

# Show current database size
echo -e "${YELLOW}Current database size:${NC}"
sudo -u postgres psql -t -c "SELECT pg_size_pretty(pg_database_size('$DB_NAME'));"
echo

# Menu
echo -e "${YELLOW}Select retention period (data OLDER than this will be deleted):${NC}"
echo
echo "  1) Keep last month"
echo "  2) Keep last 2 months"
echo "  3) Keep last 3 months"
echo "  4) Keep last 6 months"
echo "  5) Keep last 9 months"
echo "  6) Keep last 12 months"
echo "  7) Enter a custom date"
echo "  0) Exit"
echo
read -p "Enter your choice [0-7]: " choice

case $choice in
    1) CUTOFF_DATE=$(date -d "1 month ago" +%Y-%m-%d) ;;
    2) CUTOFF_DATE=$(date -d "2 months ago" +%Y-%m-%d) ;;
    3) CUTOFF_DATE=$(date -d "3 months ago" +%Y-%m-%d) ;;
    4) CUTOFF_DATE=$(date -d "6 months ago" +%Y-%m-%d) ;;
    5) CUTOFF_DATE=$(date -d "9 months ago" +%Y-%m-%d) ;;
    6) CUTOFF_DATE=$(date -d "12 months ago" +%Y-%m-%d) ;;
    7)
        echo
        read -p "Enter cutoff date (format: YYYY-MM-DD): " CUTOFF_DATE
        # Validate date format
        if ! date -d "$CUTOFF_DATE" &>/dev/null; then
            echo -e "${RED}Error: Invalid date format. Please use YYYY-MM-DD${NC}"
            exit 1
        fi
        ;;
    0)
        echo "Exiting."
        exit 0
        ;;
    *)
        echo -e "${RED}Invalid choice. Exiting.${NC}"
        exit 1
        ;;
esac

echo
echo -e "${YELLOW}Cutoff date: ${GREEN}$CUTOFF_DATE${NC}"
echo -e "${YELLOW}All data created BEFORE this date will be deleted.${NC}"
echo

# Count rows to be deleted
echo -e "${YELLOW}Calculating rows to be deleted...${NC}"
echo

COUNTS=$(sudo -u postgres psql -t -d "$DB_NAME" <<EOF
SELECT 'event_data' as table_name, COUNT(*) as count FROM event_data WHERE created_at < '$CUTOFF_DATE'
UNION ALL
SELECT 'website_event', COUNT(*) FROM website_event WHERE created_at < '$CUTOFF_DATE'
UNION ALL
SELECT 'session', COUNT(*) FROM session WHERE created_at < '$CUTOFF_DATE'
ORDER BY table_name;
EOF
)

echo -e "${YELLOW}Rows to be deleted:${NC}"
echo "$COUNTS" | while read line; do
    if [ -n "$line" ]; then
        table=$(echo "$line" | awk -F'|' '{print $1}' | xargs)
        count=$(echo "$line" | awk -F'|' '{print $2}' | xargs)
        printf "  %-20s %s rows\n" "$table:" "$count"
    fi
done
echo

# Check if there's anything to delete
TOTAL_ROWS=$(sudo -u postgres psql -t -d "$DB_NAME" -c "
SELECT 
    (SELECT COUNT(*) FROM event_data WHERE created_at < '$CUTOFF_DATE') +
    (SELECT COUNT(*) FROM website_event WHERE created_at < '$CUTOFF_DATE') +
    (SELECT COUNT(*) FROM session WHERE created_at < '$CUTOFF_DATE');
" | xargs)

if [ "$TOTAL_ROWS" -eq 0 ]; then
    echo -e "${GREEN}No data found before $CUTOFF_DATE. Nothing to delete.${NC}"
    exit 0
fi

# Confirmation
echo -e "${RED}WARNING: This operation cannot be undone!${NC}"
read -p "Do you want to proceed? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Aborted."
    exit 0
fi

# Create compressed backup
BACKUP_FILE="$BACKUP_DIR/umami_backup_$(date +%Y%m%d_%H%M%S).sql.gz"
echo
echo -e "${YELLOW}Creating compressed backup at: $BACKUP_FILE${NC}"
sudo -u postgres pg_dump "$DB_NAME" | gzip -9 > "$BACKUP_FILE"
BACKUP_SIZE=$(ls -lh "$BACKUP_FILE" | awk '{print $5}')
echo -e "${GREEN}Backup created successfully ($BACKUP_SIZE)${NC}"
echo

# Hint for restoration
echo -e "${BLUE}To restore from this backup:${NC}"
echo -e "  gunzip -c $BACKUP_FILE | sudo -u postgres psql $DB_NAME"
echo

# Perform deletion
echo -e "${YELLOW}Deleting old data...${NC}"

echo "  Deleting from event_data..."
DELETED_EVENT_DATA=$(sudo -u postgres psql -t -d "$DB_NAME" -c "DELETE FROM event_data WHERE created_at < '$CUTOFF_DATE'; SELECT COUNT(*) FROM event_data;" | tail -1 | xargs)

echo "  Deleting from website_event..."
DELETED_WEBSITE_EVENT=$(sudo -u postgres psql -t -d "$DB_NAME" -c "DELETE FROM website_event WHERE created_at < '$CUTOFF_DATE'; SELECT COUNT(*) FROM website_event;" | tail -1 | xargs)

echo "  Deleting from session..."
DELETED_SESSION=$(sudo -u postgres psql -t -d "$DB_NAME" -c "DELETE FROM session WHERE created_at < '$CUTOFF_DATE'; SELECT COUNT(*) FROM session;" | tail -1 | xargs)

echo -e "${GREEN}Deletion complete.${NC}"
echo

# Vacuum to reclaim space
echo -e "${YELLOW}Reclaiming disk space (VACUUM FULL)... this may take a while.${NC}"
sudo -u postgres psql -d "$DB_NAME" -c "VACUUM FULL event_data;"
sudo -u postgres psql -d "$DB_NAME" -c "VACUUM FULL website_event;"
sudo -u postgres psql -d "$DB_NAME" -c "VACUUM FULL session;"
echo -e "${GREEN}Vacuum complete.${NC}"
echo

# Show new database size
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Cleanup complete!${NC}"
echo
echo -e "${YELLOW}New database size:${NC}"
sudo -u postgres psql -t -c "SELECT pg_size_pretty(pg_database_size('$DB_NAME'));"
echo
echo -e "${YELLOW}Backup location:${NC} $BACKUP_FILE"
echo -e "${YELLOW}You can delete the backup once you've verified everything works.${NC}"



