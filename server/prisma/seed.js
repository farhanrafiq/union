"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../src/db");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
async function main() {
    const username = 'dealer1';
    const email = 'dealer1@example.com';
    const pwd = 'Union@2025';
    const passwordHash = await bcryptjs_1.default.hash(pwd, 10);
    const existing = await db_1.prisma.dealer.findUnique({ where: { username } });
    if (existing)
        return;
    await db_1.prisma.dealer.create({
        data: {
            username,
            email,
            passwordHash,
            companyName: 'ABC Agency',
            primaryContactName: 'John Smith',
            primaryContactPhone: '+911234567890',
            address: 'Main Street, Mumbai',
            status: 'ACTIVE'
        }
    });
    console.log('Seeded dealer:', username, 'password:', pwd);
}
main().finally(() => db_1.prisma.$disconnect());
