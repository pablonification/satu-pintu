// Run with: npx ts-node scripts/generate-password-hash.ts
import bcrypt from 'bcryptjs'

const password = 'demo2025'
const hash = bcrypt.hashSync(password, 10)

console.log('Password:', password)
console.log('Hash:', hash)
console.log('')
console.log('SQL to update dinas passwords:')
console.log(`UPDATE dinas SET password_hash = '${hash}';`)
