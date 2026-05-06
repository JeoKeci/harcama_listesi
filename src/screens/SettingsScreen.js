import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert,
  Switch,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../theme/colors';
import useStore from '../store/useStore';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

export default function SettingsScreen() {
  const { wallets, projects, addWallet, addProject, getExportData } = useStore();

  const [newWalletName, setNewWalletName] = useState('');
  const [newWalletType, setNewWalletType] = useState('Cash');
  const [newWalletOwner, setNewWalletOwner] = useState('Personal');
  
  const [newProjectName, setNewProjectName] = useState('');

  const handleAddWallet = async () => {
    if (!newWalletName) return;
    await addWallet(newWalletName, newWalletType, newWalletOwner);
    setNewWalletName('');
    Alert.alert('Başarılı', 'Cüzdan eklendi.');
  };

  const handleAddProject = async () => {
    if (!newProjectName) return;
    await addProject(newProjectName);
    setNewProjectName('');
    Alert.alert('Başarılı', 'Proje eklendi.');
  };

  const handleExport = async () => {
    try {
      const data = await getExportData();
      const jsonString = JSON.stringify(data, null, 2);
      const fileUri = FileSystem.documentDirectory + 'harcama_yedek.json';
      
      await FileSystem.writeAsStringAsync(fileUri, jsonString);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      }
    } catch (error) {
      Alert.alert('Hata', 'Veri dışa aktarılırken bir hata oluştu.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Ayarlar</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Wallet Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cüzdan Yönetimi</Text>
          <View style={styles.card}>
            <TextInput
              style={styles.input}
              placeholder="Cüzdan Adı (Örn: Bonus Kart)"
              placeholderTextColor={theme.textMuted}
              value={newWalletName}
              onChangeText={setNewWalletName}
            />
            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.smallBtn, newWalletType === 'Cash' && styles.activeBtn]}
                onPress={() => setNewWalletType('Cash')}
              >
                <Text style={[styles.btnText, newWalletType === 'Cash' && { color: '#FFF' }]}>Nakit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.smallBtn, newWalletType === 'Card' && styles.activeBtn]}
                onPress={() => setNewWalletType('Card')}
              >
                <Text style={[styles.btnText, newWalletType === 'Card' && { color: '#FFF' }]}>Kart</Text>
              </TouchableOpacity>
              <View style={{ flex: 1 }} />
              <TouchableOpacity
                style={[styles.smallBtn, newWalletOwner === 'Personal' && { backgroundColor: theme.personal }]}
                onPress={() => setNewWalletOwner('Personal')}
              >
                <Text style={[styles.btnText, newWalletOwner === 'Personal' && { color: '#FFF' }]}>Kişisel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.smallBtn, newWalletOwner === 'Company' && { backgroundColor: theme.business }]}
                onPress={() => setNewWalletOwner('Company')}
              >
                <Text style={[styles.btnText, newWalletOwner === 'Company' && { color: '#FFF' }]}>Şirket</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.addBtn} onPress={handleAddWallet}>
              <Text style={styles.addBtnText}>Cüzdan Ekle</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Project Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Proje Yönetimi</Text>
          <View style={styles.card}>
            <TextInput
              style={styles.input}
              placeholder="Yeni Proje Adı"
              placeholderTextColor={theme.textMuted}
              value={newProjectName}
              onChangeText={setNewProjectName}
            />
            <TouchableOpacity style={styles.addBtn} onPress={handleAddProject}>
              <Text style={styles.addBtnText}>Proje Ekle</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Data Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Veri Yönetimi</Text>
          <TouchableOpacity style={styles.exportBtn} onPress={handleExport}>
            <MaterialIcons name="backup" size={24} color="#FFF" />
            <Text style={styles.exportBtnText}>Verileri JSON Olarak Yedekle</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { padding: 24, borderBottomWidth: 1, borderBottomColor: theme.border },
  title: { color: theme.text, fontSize: 20, fontWeight: 'bold' },
  content: { padding: 24 },
  section: { marginBottom: 32 },
  sectionTitle: { color: theme.textMuted, fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 12 },
  card: { backgroundColor: theme.surface, borderRadius: 16, padding: 16 },
  input: { backgroundColor: theme.surfaceLight, borderRadius: 12, padding: 12, color: theme.text, marginBottom: 12 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  smallBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: theme.surfaceLight },
  activeBtn: { backgroundColor: theme.primary },
  btnText: { color: theme.textMuted, fontSize: 12, fontWeight: 'bold' },
  addBtn: { backgroundColor: theme.primary + '20', borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: theme.primary },
  addBtnText: { color: theme.primary, fontWeight: 'bold' },
  exportBtn: { backgroundColor: theme.secondary, borderRadius: 16, paddingVertical: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12 },
  exportBtnText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
});
