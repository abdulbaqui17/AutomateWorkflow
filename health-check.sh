#!/bin/bash

# Health Check and Monitoring Script
# Run this to check the status of all services

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Week2 Application Status Check    ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo ""

# Check Docker
echo -e "${YELLOW}Docker Status:${NC}"
if systemctl is-active --quiet docker; then
    echo -e "  ${GREEN}✓${NC} Docker is running"
else
    echo -e "  ${RED}✗${NC} Docker is not running"
fi
echo ""

# Check Nginx
echo -e "${YELLOW}Nginx Status:${NC}"
if systemctl is-active --quiet nginx; then
    echo -e "  ${GREEN}✓${NC} Nginx is running"
else
    echo -e "  ${RED}✗${NC} Nginx is not running"
fi
echo ""

# Check containers
echo -e "${YELLOW}Container Status:${NC}"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo -e "${YELLOW}Container Health:${NC}"

services=("postgres" "zookeeper" "kafka" "apis" "web" "processor" "workers")

for service in "${services[@]}"; do
    status=$(docker inspect -f '{{.State.Status}}' week2-${service} 2>/dev/null)
    if [ "$status" == "running" ]; then
        echo -e "  ${GREEN}✓${NC} ${service}: running"
    else
        echo -e "  ${RED}✗${NC} ${service}: ${status:-not found}"
    fi
done

echo ""
echo -e "${YELLOW}Resource Usage:${NC}"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"

echo ""
echo -e "${YELLOW}Disk Usage:${NC}"
df -h / | tail -n 1 | awk '{print "  Used: "$3" / "$2" ("$5")"}'

echo ""
echo -e "${YELLOW}Memory Usage:${NC}"
free -h | grep Mem | awk '{print "  Used: "$3" / "$2" ("$3/$2*100"%)"}'

echo ""
echo -e "${YELLOW}Endpoint Checks:${NC}"

# Check API health
if curl -sf http://localhost:3001/health > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} API Health Check: OK"
else
    echo -e "  ${RED}✗${NC} API Health Check: Failed"
fi

# Check Web
if curl -sf http://localhost:3000 > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} Web Application: OK"
else
    echo -e "  ${RED}✗${NC} Web Application: Failed"
fi

echo ""
echo -e "${YELLOW}Recent Errors (last 20 lines):${NC}"
docker-compose -f docker-compose.prod.yml logs --tail=20 2>&1 | grep -i "error\|exception\|fail" || echo -e "  ${GREEN}No recent errors${NC}"

echo ""
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "To view full logs: ${YELLOW}docker-compose -f docker-compose.prod.yml logs -f${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
