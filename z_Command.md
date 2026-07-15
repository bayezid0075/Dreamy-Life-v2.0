# View latest errors
cat /root/Dreamy-Life-v2.0/logs/errors.json | jq '.errors[-5:]'

# Or tail the file
tail -c 2000 /root/Dreamy-Life-v2.0/logs/errors.json