const {verifyProof} = require("./lib/verify");

async function main() {
    const input = {
        "a" : 5, "b": 6
    };
    const path = "./simple";
    const pvtKey = "suiprivkey1qr9jn904a0pctzrq3ud2z5c8fx2dl5ndu3ywk65lusvw8nkpr9n36rpxqj8";
    await verifyProof(input, path, pvtKey);
}

main()