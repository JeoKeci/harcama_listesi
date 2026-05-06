import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
} from 'react-native';
import { theme } from '../theme/colors';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import useStore from '../store/useStore';

export const AddExpenseModal = ({ visible, onClose }) => {
  const { wallets, projects, categories, cities, addTransaction } = useStore();

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('Personal'); // 'Personal' | 'Company'
  const [selectedWalletId, setSelectedWalletId] = useState(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [city, setCity] = useState('');
  const [receiptUri, setReceiptUri] = useState(null);

  // Set default wallet and categories when type changes
  useEffect(() => {
    const typeWallets = wallets.filter(w => w.owner === type);
    if (typeWallets.length > 0) {
      setSelectedWalletId(typeWallets[0].id);
    }

    const typeCategories = categories.filter(c => c.type === type);
    if (typeCategories.length > 0) {
      setSelectedCategoryId(typeCategories[0].id);
    }
    
    if (type === 'Company' && projects.length > 0) {
      setSelectedProjectId(projects[0].id);
    } else {
      setSelectedProjectId(null);
    }
  }, [type, wallets, categories, projects]);

  const resetForm = () => {
    setAmount('');
    setDescription('');
    setType('Personal');
    setCity('');
    setReceiptUri(null);
  };

  const handleSave = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Hata', 'Lütfen geçerli bir tutar giriniz.');
      return;
    }
    if (!selectedWalletId || !selectedCategoryId) {
      Alert.alert('Hata', 'Lütfen cüzdan ve kategori seçiniz.');
      return;
    }

    try {
      await addTransaction({
        date: new Date().toISOString(),
        amount: parseFloat(amount),
        wallet_id: selectedWalletId,
        category_id: selectedCategoryId,
        project_id: type === 'Company' ? selectedProjectId : null,
        city: type === 'Personal' ? city : null,
        description,
        receipt_uri: receiptUri,
        is_offset_transaction: false,
      });

      resetForm();
      onClose();
    } catch (error) {
      Alert.alert('Hata', 'İşlem kaydedilirken bir sorun oluştu.');
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });

    if (!result.canceled) {
      setReceiptUri(result.assets[0].uri);
    }
  };

  const filteredCategories = categories.filter(c => c.type === type);
  const filteredWallets = wallets.filter(w => w.owner === type);

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Yeni Harcama</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Amount Input */}
            <View style={styles.amountSection}>
              <Text style={styles.currencySign}>₺</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                placeholderTextColor={theme.textMuted}
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
                autoFocus
              />
            </View>

            {/* Type Selector (Personal / Company) */}
            <Text style={styles.sectionLabel}>Harcama Türü</Text>
            <View style={styles.typeRow}>
              <TouchableOpacity
                style={[styles.typeButton, type === 'Personal' && styles.activePersonal]}
                onPress={() => setType('Personal')}
              >
                <MaterialIcons name="person" size={20} color={type === 'Personal' ? theme.personal : theme.textMuted} />
                <Text style={[styles.typeText, type === 'Personal' && { color: theme.personal }]}>Kişisel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.typeButton, type === 'Company' && styles.activeCompany]}
                onPress={() => setType('Company')}
              >
                <MaterialIcons name="business-center" size={20} color={type === 'Company' ? theme.business : theme.textMuted} />
                <Text style={[styles.typeText, type === 'Company' && { color: theme.business }]}>Şantiye</Text>
              </TouchableOpacity>
            </View>

            {/* Wallet Selector */}
            <Text style={styles.sectionLabel}>Ödeme Yapılan Cüzdan</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {filteredWallets.map(w => (
                <TouchableOpacity
                  key={w.id}
                  style={[styles.chip, selectedWalletId === w.id && styles.activeChip]}
                  onPress={() => setSelectedWalletId(w.id)}
                >
                  <MaterialIcons name={w.type === 'Cash' ? 'payments' : 'credit-card'} size={16} color={selectedWalletId === w.id ? '#FFF' : theme.textMuted} />
                  <Text style={[styles.chipText, selectedWalletId === w.id && styles.activeChipText]}>{w.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Category Selector */}
            <Text style={styles.sectionLabel}>Kategori</Text>
            <View style={styles.grid}>
              {filteredCategories.map(c => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.gridItem, selectedCategoryId === c.id && styles.activeGridItem]}
                  onPress={() => setSelectedCategoryId(c.id)}
                >
                  <Text style={[styles.gridText, selectedCategoryId === c.id && styles.activeGridText]}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Conditional Fields */}
            {type === 'Company' && (
              <>
                <Text style={styles.sectionLabel}>Proje</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                  {projects.map(p => (
                    <TouchableOpacity
                      key={p.id}
                      style={[styles.chip, selectedProjectId === p.id && styles.activeChip]}
                      onPress={() => setSelectedProjectId(p.id)}
                    >
                      <Text style={[styles.chipText, selectedProjectId === p.id && styles.activeChipText]}>{p.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            {type === 'Personal' && (
              <>
                <Text style={styles.sectionLabel}>Şehir</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Şehir adı giriniz (İsteğe bağlı)..."
                  placeholderTextColor={theme.textMuted}
                  value={city}
                  onChangeText={setCity}
                />
              </>
            )}

            {/* Description */}
            <Text style={styles.sectionLabel}>Açıklama</Text>
            <TextInput
              style={styles.input}
              placeholder="Harcama detayı..."
              placeholderTextColor={theme.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
            />

            {/* Receipt Capture */}
            <Text style={styles.sectionLabel}>Fiş / Fatura</Text>
            <View style={styles.receiptSection}>
              {receiptUri ? (
                <View style={styles.previewContainer}>
                  <Image source={{ uri: receiptUri }} style={styles.previewImage} />
                  <TouchableOpacity style={styles.removeImage} onPress={() => setReceiptUri(null)}>
                    <MaterialIcons name="cancel" size={24} color={theme.danger} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.captureButton} onPress={pickImage}>
                  <MaterialIcons name="photo-camera" size={32} color={theme.primary} />
                  <Text style={styles.captureText}>Fotoğraf Çek</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>

          {/* Save Button */}
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Kaydet</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalContainer: {
    backgroundColor: theme.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 34,
    maxHeight: '90%',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { color: theme.text, fontSize: 20, fontWeight: 'bold' },
  closeButton: { padding: 4 },
  amountSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  currencySign: { color: theme.primary, fontSize: 32, fontWeight: 'bold', marginRight: 8 },
  amountInput: { color: theme.text, fontSize: 32, fontWeight: 'bold', minWidth: 100, textAlign: 'center' },
  sectionLabel: { color: theme.textMuted, fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 8, marginTop: 12 },
  typeRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  activePersonal: { borderColor: theme.personal, backgroundColor: theme.personal + '10' },
  activeCompany: { borderColor: theme.business, backgroundColor: theme.business + '10' },
  typeText: { color: theme.textMuted, fontWeight: 'bold' },
  chipScroll: { marginBottom: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    marginRight: 8,
  },
  activeChip: { backgroundColor: theme.primary, borderColor: theme.primary },
  chipText: { color: theme.textMuted, fontSize: 13, fontWeight: '600' },
  activeChipText: { color: '#FFF' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  gridItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  activeGridItem: { borderColor: theme.primary, backgroundColor: theme.primary + '10' },
  gridText: { color: theme.textMuted, fontSize: 12 },
  activeGridText: { color: theme.primary, fontWeight: 'bold' },
  input: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 12,
    color: theme.text,
    borderWidth: 1,
    borderColor: theme.border,
  },
  receiptSection: { marginTop: 8 },
  captureButton: {
    height: 100,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: theme.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureText: { color: theme.textMuted, marginTop: 8, fontSize: 12 },
  previewContainer: { position: 'relative', height: 150, borderRadius: 16, overflow: 'hidden' },
  previewImage: { width: '100%', height: '100%' },
  removeImage: { position: 'absolute', top: 8, right: 8, backgroundColor: '#FFF', borderRadius: 12 },
  saveButton: {
    backgroundColor: theme.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});
