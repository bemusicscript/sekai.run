# 3.171.185.63 -> icn

echo "===== ICN"
ICN_START=$(date +%s.%N)
for f in `seq 10`
do
    # random2=$RANDOM
    curl \
        --resolve 'production-game-api.sekai.colorfulpalette.org:443:3.170.221.48' \
        -s "https://production-game-api.sekai.colorfulpalette.org/api/user/0/auth?refreshUpdatedResources=False" \
        -X "PUT" \
        -H 'User-Agent: ProductName/176 CFNetwork/1404.0.5 Darwin/22.3.0' \
        -d '{"credential": "AA=="}' \
        -o /dev/null \
        -w %{time_total}\\n
done
ICN_END=$(date +%s.%N)
ICN_DIFF=$(echo "$ICN_END - $ICN_START" | bc)

# 3.165.11.119  -> server-3-165-11-118.nrt12.r.cloudfront.net
echo "===== NRT"
NRT_START=$(date +%s.%N)
for f in `seq 10`
do
    curl \
        --resolve 'production-game-api.sekai.colorfulpalette.org:443:3.164.143.82' \
        -s "https://production-game-api.sekai.colorfulpalette.org/api/user/0/auth?refreshUpdatedResources=False" \
        -X "PUT" \
        -H 'User-Agent: ProductName/176 CFNetwork/1404.0.5 Darwin/22.3.0' \
        -d '{"credential": "AA=="}' \
        -o /dev/null \
        -w %{time_total}\\n
done
NRT_END=$(date +%s.%N)
NRT_DIFF=$(echo "$NRT_END - $NRT_START" | bc)

echo "==========="
echo "ICN Total: $ICN_DIFF"
echo "NRT Total: $NRT_DIFF"

