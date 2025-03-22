/**
 * In-memory data store for fallback when database is unavailable
 */
const memoryStore = {
    users: [],
    lastId: 0,
    
    // Initialize with test user
    init() {
        if (this.users.length === 0) {
            this.users.push({
                id: ++this.lastId,
                email: 'test@example.com',
                password_hash: '$2a$10$3euPcmQFCiblsZeEu5s7p.9MUZWj3bcJzuLFJBs9QVdYj.RRVCICK', // test123
                created_at: new Date(),
                updated_at: new Date()
            });
            console.log('Added test user to in-memory storage. Email: test@example.com, Password: test123');
        }
    },
    
    // Reset store
    clear() {
        this.users = [];
        this.lastId = 0;
    }
};

// Initialize on import
memoryStore.init();

module.exports = memoryStore;
