/**
 * Health Tip model
 */
class HealthTip {
    constructor(data) {
        this.id = data.id;
        this.title = data.title;
        this.content = data.content;
        this.category = data.category;
        this.image_url = data.image_url || null;
        this.source = data.source || null;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    /**
     * Convert to JSON representation
     */
    toJSON() {
        return {
            id: this.id,
            title: this.title,
            content: this.content,
            category: this.category,
            image_url: this.image_url,
            source: this.source,
            created_at: this.created_at,
            updated_at: this.updated_at
        };
    }

    /**
     * Valid health tip categories
     */
    static getCategories() {
        return [
            'General Wellness', 
            'Nutrition', 
            'Exercise', 
            'Mental Health', 
            'Sleep', 
            'Preventive Care'
        ];
    }
}

module.exports = HealthTip;