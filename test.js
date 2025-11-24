const {verifyProof} = require("./lib/verify");

async function main() {
    const input = {
        "a" : 5, "b": 6
    };
    const path = "./simple";

    await verifyProof(input, path);
}

main()