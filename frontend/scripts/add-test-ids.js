/**
 * This script adds test IDs to components in the app/(tabs) folder
 * It's designed to help with unit testing by making components easier to select
 */

const fs = require('fs');
const path = require('path');

const tabsDir = path.join(__dirname, '../app/(tabs)');
const files = fs.readdirSync(tabsDir);

const testIdInsertions = {
  'index.tsx': [
    {
      pattern: /<ScrollView\s+/g,
      replacement: '<ScrollView testID="home-scroll-view" '
    },
    {
      pattern: /<ActivityIndicator\s+size="large"/g,
      replacement: '<ActivityIndicator testID="loading-indicator" size="large"'
    }
  ],
  'appointments.tsx': [
    {
      pattern: /<ActivityIndicator\s+size="large"/g,
      replacement: '<ActivityIndicator testID="appointments-loading" size="large"'
    },
    {
      pattern: /<FlatList\s+/g,
      replacement: '<FlatList testID="appointments-list" '
    },
    {
      pattern: /<TouchableOpacity\s+style={styles\.addButton}/g,
      replacement: '<TouchableOpacity testID="add-appointment-button" style={styles.addButton}'
    },
    {
      pattern: /<TouchableOpacity\s+onPress={\(\)\s*=>\s*handleAppointmentPress\(item\)}/g,
      replacement: '<TouchableOpacity testID="appointment-card" onPress={() => handleAppointmentPress(item)}'
    }
  ],
  'profile.tsx': [
    {
      pattern: /<ActivityIndicator\s+size="large"/g,
      replacement: '<ActivityIndicator testID="profile-loading" size="large"'
    },
    {
      pattern: /<Switch\s+value={notificationsEnabled}/g,
      replacement: '<Switch testID="notifications-switch" value={notificationsEnabled}'
    },
    {
      pattern: /<Switch\s+value={darkModeEnabled}/g,
      replacement: '<Switch testID="darkmode-switch" value={darkModeEnabled}'
    },
    {
      pattern: /<Switch\s+value={locationEnabled}/g,
      replacement: '<Switch testID="location-switch" value={locationEnabled}'
    },
    {
      pattern: /<TouchableOpacity\s+style={styles\.editButton}/g,
      replacement: '<TouchableOpacity testID="edit-profile-button" style={styles.editButton}'
    }
  ],
  'feedback.tsx': [
    {
      pattern: /<ActivityIndicator\s+size="large"/g,
      replacement: '<ActivityIndicator testID="feedback-loading" size="large"'
    },
    {
      pattern: /<TouchableOpacity\s+style={styles\.feedbackCard}/g,
      replacement: '<TouchableOpacity testID="feedback-card" style={styles.feedbackCard}'
    },
    {
      pattern: /<TouchableOpacity\s+onPress={\(\)\s*=>\s*handlePendingFeedback\(item\)}/g,
      replacement: '<TouchableOpacity testID="pending-feedback-card" onPress={() => handlePendingFeedback(item)}'
    },
    {
      pattern: /<View\s+style={styles\.ratingContainer}>/g,
      replacement: '<View testID="rating-stars" style={styles.ratingContainer}>'
    },
    {
      pattern: /<TouchableOpacity\s+onPress={\(\)\s*=>\s*handleEditFeedback\(item\)}/g,
      replacement: '<TouchableOpacity testID="edit-feedback-button" onPress={() => handleEditFeedback(item)}'
    }
  ],
  '_layout.tsx': [
    {
      pattern: /<TouchableOpacity\s+onPress={toggleFabMenu}\s+style={styles\.fab}/g,
      replacement: '<TouchableOpacity testID="fab-button" onPress={toggleFabMenu} style={styles.fab}'
    },
    {
      pattern: /<TouchableOpacity\s+style={styles\.fabMenuItem}\s+onPress={handleNewConsultation}>/g,
      replacement: '<TouchableOpacity testID="fab-menu-item-consultation" style={styles.fabMenuItem} onPress={handleNewConsultation}>'
    },
    {
      pattern: /<TouchableOpacity\s+style={styles\.fabMenuItem}\s+onPress={handleFollowUpAppointment}>/g,
      replacement: '<TouchableOpacity testID="fab-menu-item-followup" style={styles.fabMenuItem} onPress={handleFollowUpAppointment}>'
    }
  ]
};

// Process each file
files.forEach(file => {
  if (testIdInsertions[file]) {
    const filePath = path.join(tabsDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Apply each insertion for this file
    testIdInsertions[file].forEach(({ pattern, replacement }) => {
      content = content.replace(pattern, replacement);
    });
    
    // Write the updated content back
    fs.writeFileSync(filePath, content);
    console.log(`Added test IDs to ${file}`);
  }
});

console.log('All test IDs have been added!');
