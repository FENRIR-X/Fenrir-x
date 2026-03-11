// lib/permissions.js
// Shared Owner & Sudo Permission System

const fs = require("fs");
const path = require("path");

// =====================================
// SUDO SYSTEM - FILE MANAGEMENT
// =====================================

const SUDO_FILE = path.join(__dirname, '..', 'sudo.json');

// Initialize sudo file if doesn't exist
function initSudoFile() {
  if (!fs.existsSync(SUDO_FILE)) {
    fs.writeFileSync(SUDO_FILE, JSON.stringify({ sudoUsers: [] }, null, 2));
    console.log('✅ sudo.json created');
  }
}

// Read sudo list
function getSudoList() {
  try {
    initSudoFile();
    const data = fs.readFileSync(SUDO_FILE, 'utf8');
    return JSON.parse(data).sudoUsers || [];
  } catch {
    return [];
  }
}

// Add sudo user
function addSudo(number) {
  try {
    const sudoList = getSudoList();
    if (sudoList.includes(number)) {
      return { success: false, message: 'Already sudo user!' };
    }
    sudoList.push(number);
    fs.writeFileSync(SUDO_FILE, JSON.stringify({ sudoUsers: sudoList }, null, 2));
    return { success: true, message: 'Added as sudo!' };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.message };
  }
}

// Remove sudo user
function removeSudo(number) {
  try {
    let sudoList = getSudoList();
    if (!sudoList.includes(number)) {
      return { success: false, message: 'Not a sudo user!' };
    }
    sudoList = sudoList.filter(n => n !== number);
    fs.writeFileSync(SUDO_FILE, JSON.stringify({ sudoUsers: sudoList }, null, 2));
    return { success: true, message: 'Sudo removed!' };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.message };
  }
}

// =====================================
// PERMISSION CHECK FUNCTIONS
// =====================================

// Check if REAL owner (bot number only - for managing sudo)
function isRealOwner(conn, senderJid) {
  try {
    const senderNumber = senderJid.split('@')[0].replace(/\D/g, '');
    const botNumber = conn.user.id.split(':')[0].replace(/\D/g, '');
    return senderNumber === botNumber;
  } catch {
    return false;
  }
}

// Check if owner OR sudo (for using owner commands)
function isOwner(conn, senderJid) {
  try {
    const senderNumber = senderJid.split('@')[0].replace(/\D/g, '');
    const botNumber = conn.user.id.split(':')[0].replace(/\D/g, '');
    
    // Check 1: Is bot owner?
    if (senderNumber === botNumber) {
      console.log('  ✅ Owner Check: REAL OWNER');
      return true;
    }
    
    // Check 2: Is sudo user?
    const sudoList = getSudoList();
    if (sudoList.includes(senderNumber)) {
      console.log('  ✅ Owner Check: SUDO USER');
      return true;
    }
    
    console.log('  ❌ Owner Check: NOT AUTHORIZED');
    return false;
  } catch (err) {
    console.error('Owner check error:', err);
    return false;
  }
}

// Extract number from message (for addsudo/delsudo)
function extractNumber(m, args) {
  if (m.message?.extendedTextMessage?.contextInfo?.participant) {
    return m.message.extendedTextMessage.contextInfo.participant.split('@')[0].replace(/\D/g, '');
  }
  if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]) {
    return m.message.extendedTextMessage.contextInfo.mentionedJid[0].split('@')[0].replace(/\D/g, '');
  }
  if (args[0]) {
    return args[0].replace(/\D/g, '');
  }
  return null;
}

// =====================================
// EXPORT ALL FUNCTIONS
// =====================================

module.exports = {
  isRealOwner,
  isOwner,
  getSudoList,
  addSudo,
  removeSudo,
  extractNumber
};
