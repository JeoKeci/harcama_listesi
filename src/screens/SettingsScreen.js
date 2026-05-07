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
  Modal,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../theme/colors';
import useStore from '../store/useStore';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { IncomeModal } from '../components/IncomeModal';

export default function SettingsScreen() {
  const { 
    wallets, 
    projects, 
    addWallet, 
    editWallet,
    removeWallet,
    addProject, 
    editProject,
    removeProject,
    getExportData 
  } = useStore();

  const [newWalletName, setNewWalletName] = useState('');
  const [newWalletType, setNewWalletType] = useState('Cash');
  const [newWalletOwner, setNewWalletOwner] = useState('Personal');
  
  const [newProjectName, setNewProjectName] = useState('');

  // Edit states
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // { type: 'wallet'|'project', data: {} }
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState('Cash');
  const [editOwner, setEditOwner] = useState('Personal');
  
  // Income states
  const [incomeModalVisible, setIncomeModalVisible] = useState(false);
  const [selectedWalletForIncome, setSelectedWalletForIncome] = useState(null);

  const handleAddWallet = async () => {
    if (!newWalletName) return;
    try {
      await addWallet(newWalletName, newWalletType, newWalletOwner);
      setNewWalletName('');
      Alert.alert('Başarılı', 'Cüzdan eklendi.');
    } catch (error) {
      Alert.alert('Hata', 'Cüzdan eklenirken hata oluştu: ' + error.message);
    }
  };

  const handleAddProject = async () => {
    if (!newProjectName) return;
    try {
      await addProject(newProjectName);
      setNewProjectName('');
      Alert.alert('Başarılı', 'Proje eklendi.');
    } catch (error) {
      Alert.alert('Hata', 'Proje eklenirken hata oluştu: ' + error.message);
    }
  };

  const openEditModal = (item, type) => {
    setEditingItem({ type, data: item });
    setEditName(item.name);
    if (type === 'wallet') {
      setEditType(item.type);
      setEditOwner(item.owner);
    }
    setEditModalVisible(true);
  };

  const openIncomeModal = (wallet) => {
    setSelectedWalletForIncome(wallet);
    setIncomeModalVisible(true);
  };

  const handleUpdate = async () => {
    if (!editName) return;
    try {
      if (editingItem.type === 'wallet') {
        await editWallet(editingItem.data.id, editName, editType, editOwner);
      } else {
        await editProject(editingItem.data.id, editName);
      }
      setEditModalVisible(false);
      Alert.alert('Başarılı', 'Güncellendi.');
    } catch (error) {
      Alert.alert('Hata', 'Güncelleme hatası: ' + error.message);
    }
  };

  const handleDelete = (item, type) => {
    Alert.alert(
      'Silme Onayı',
      `"${item.name}" ${type === 'wallet' ? 'cüzdanını' : 'projesini'} silmek istediğinize emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Sil', 
          style: 'destructive',
          onPress: async () => {
            try {
              if (type === 'wallet') await removeWallet(item.id);
              else await removeProject(item.id);
            } catch (error) {
              Alert.alert('Hata', 'Silme işlemi başarısız.');
            }
          }
        }
      ]
    );
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
    <View style={styles.container}>
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

          {/* Wallet List */}
          <View style={styles.listContainer}>
            {wallets.map(w => (
              <View key={w.id} style={styles.listItem}>
                <TouchableOpacity 
                  style={styles.listItemInfo} 
                  onPress={() => openIncomeModal(w)}
                >
                  <MaterialIcons 
                    name={w.type === 'Cash' ? 'payments' : 'credit-card'} 
                    size={20} 
                    color={w.owner === 'Personal' ? theme.personal : theme.business} 
                  />
                  <View>
                    <Text style={styles.listItemName}>{w.name}</Text>
                    <Text style={[styles.listItemBalance, w.balance < 0 && { color: theme.danger }]}>
                      {w.balance.toFixed(2)} ₺
                    </Text>
                  </View>
                </TouchableOpacity>
                <View style={styles.listItemActions}>
                  <TouchableOpacity onPress={() => openEditModal(w, 'wallet')} style={styles.actionBtn}>
                    <MaterialIcons name="edit" size={20} color={theme.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(w, 'wallet')} style={styles.actionBtn}>
                    <MaterialIcons name="delete-outline" size={20} color={theme.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
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

          {/* Project List */}
          <View style={styles.listContainer}>
            {projects.map(p => (
              <View key={p.id} style={styles.listItem}>
                <View style={styles.listItemInfo}>
                  <MaterialIcons name="business" size={20} color={theme.business} />
                  <Text style={styles.listItemName}>{p.name}</Text>
                </View>
                <View style={styles.listItemActions}>
                  <TouchableOpacity onPress={() => openEditModal(p, 'project')} style={styles.actionBtn}>
                    <MaterialIcons name="edit" size={20} color={theme.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(p, 'project')} style={styles.actionBtn}>
                    <MaterialIcons name="delete-outline" size={20} color={theme.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Data Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Veri Yönetimi</Text>
          <TouchableOpacity style={styles.exportBtn} onPress={handleExport}>
            <MaterialIcons name="backup" size={24} color="#FFF" />
            <Text style={styles.exportBtnText}>Verileri JSON Olarak Yedekle</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.exportBtn, { backgroundColor: theme.danger, marginTop: 12 }]} 
            onPress={() => {
              Alert.alert(
                'Tehlikeli İşlem',
                'Tüm veritabanı silinecek ve varsayılan ayarlara dönülecek. Emin misiniz?',
                [
                  { text: 'İptal', style: 'cancel' },
                  { 
                    text: 'Evet, Sıfırla', 
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        await useStore.getState().resetApp();
                        Alert.alert('Başarılı', 'Veritabanı sıfırlandı.');
                      } catch(e) {
                        Alert.alert('Hata', 'Sıfırlama başarısız: ' + e.message);
                      }
                    }
                  }
                ]
              );
            }}
          >
            <MaterialIcons name="delete-forever" size={24} color="#FFF" />
            <Text style={styles.exportBtnText}>Veritabanını Sıfırla (Tüm Verileri Sil)</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={editModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingItem?.type === 'wallet' ? 'Cüzdan Düzenle' : 'Proje Düzenle'}
            </Text>
            
            <TextInput
              style={styles.input}
              value={editName}
              onChangeText={setEditName}
              placeholder="İsim giriniz..."
              placeholderTextColor={theme.textMuted}
            />

            {editingItem?.type === 'wallet' && (
              <>
                <View style={styles.row}>
                  <TouchableOpacity
                    style={[styles.smallBtn, editType === 'Cash' && styles.activeBtn]}
                    onPress={() => setEditType('Cash')}
                  >
                    <Text style={[styles.btnText, editType === 'Cash' && { color: '#FFF' }]}>Nakit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.smallBtn, editType === 'Card' && styles.activeBtn]}
                    onPress={() => setEditType('Card')}
                  >
                    <Text style={[styles.btnText, editType === 'Card' && { color: '#FFF' }]}>Kart</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.row}>
                  <TouchableOpacity
                    style={[styles.smallBtn, editOwner === 'Personal' && { backgroundColor: theme.personal }]}
                    onPress={() => setEditOwner('Personal')}
                  >
                    <Text style={[styles.btnText, editOwner === 'Personal' && { color: '#FFF' }]}>Kişisel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.smallBtn, editOwner === 'Company' && { backgroundColor: theme.business }]}
                    onPress={() => setEditOwner('Company')}
                  >
                    <Text style={[styles.btnText, editOwner === 'Company' && { color: '#FFF' }]}>Şirket</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalBtn, { backgroundColor: theme.surfaceLight }]} 
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.modalBtnText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalBtn, { backgroundColor: theme.primary }]} 
                onPress={handleUpdate}
              >
                <Text style={[styles.modalBtnText, { color: '#FFF' }]}>Güncelle</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {selectedWalletForIncome && (
        <IncomeModal
          visible={incomeModalVisible}
          onClose={() => setIncomeModalVisible(false)}
          wallet={selectedWalletForIncome}
        />
      )}
    </View>
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
  listContainer: { marginTop: 12 },
  listItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: theme.surface, padding: 12, borderRadius: 12, marginBottom: 8 },
  listItemInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  listItemName: { color: theme.text, fontSize: 14, fontWeight: '500' },
  listItemBalance: { color: theme.textMuted, fontSize: 12, fontWeight: 'bold' },
  listItemActions: { flexDirection: 'row', gap: 4 },
  actionBtn: { padding: 8 },
  exportBtn: { backgroundColor: theme.secondary, borderRadius: 16, paddingVertical: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12 },
  exportBtnText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalContent: { backgroundColor: theme.surface, borderRadius: 24, padding: 24 },
  modalTitle: { color: theme.text, fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 12 },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  modalBtnText: { fontWeight: 'bold', color: theme.text },
});
