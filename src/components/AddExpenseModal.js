import React, { useState } from 'react';
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
  Animated,
} from 'react-native';
import { theme } from '../theme/colors';
import { MaterialIcons } from '@expo/vector-icons';

const SUB_CATEGORIES = {
  personal: ['Yemek', 'Market', 'Ulaşım', 'Fatura', 'Eğlence', 'Sağlık', 'Giyim', 'Diğer'],
  business: ['Ofis Gideri', 'Seyahat', 'Yazılım/Araç', 'Toplantı', 'Reklam', 'Vergi', 'Diğer'],
};

export const AddExpenseModal = ({ visible, onClose, onSave }) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('personal');
  const [subCategory, setSubCategory] = useState('');

  const resetForm = () => {
    setAmount('');
    setDescription('');
    setType('personal');
    setSubCategory('');
  };

  const handleSave = () => {
    if (!amount || parseFloat(amount) <= 0) return;
    if (!subCategory) return;

    onSave({
      amount: parseFloat(amount),
      currency: '₺',
      type,
      subCategory,
      description: description || subCategory,
      date: new Date().toISOString(),
    });

    resetForm();
    onClose();
  };

  const currentSubCategories = SUB_CATEGORIES[type] || [];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Yeni Harcama</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Tutar Alanı */}
            <View style={styles.amountSection}>
              <Text style={styles.currencySign}>₺</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                placeholderTextColor={theme.textMuted}
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
              />
            </View>

            {/* Ana Kategori Seçimi (Kişisel / İş) */}
            <Text style={styles.sectionLabel}>Kategori</Text>
            <View style={styles.typeRow}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  type === 'personal' && { backgroundColor: theme.personal + '25', borderColor: theme.personal },
                ]}
                onPress={() => { setType('personal'); setSubCategory(''); }}
                activeOpacity={0.7}
              >
                <MaterialIcons name="person" size={20} color={type === 'personal' ? theme.personal : theme.textMuted} />
                <Text style={[styles.typeText, type === 'personal' && { color: theme.personal }]}>
                  Kişisel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeButton,
                  type === 'business' && { backgroundColor: theme.business + '25', borderColor: theme.business },
                ]}
                onPress={() => { setType('business'); setSubCategory(''); }}
                activeOpacity={0.7}
              >
                <MaterialIcons name="business-center" size={20} color={type === 'business' ? theme.business : theme.textMuted} />
                <Text style={[styles.typeText, type === 'business' && { color: theme.business }]}>
                  İş
                </Text>
              </TouchableOpacity>
            </View>

            {/* Alt Kategori Seçimi */}
            <Text style={styles.sectionLabel}>Alt Kategori</Text>
            <View style={styles.subCatGrid}>
              {currentSubCategories.map((cat) => {
                const isSelected = subCategory === cat;
                const activeColor = type === 'personal' ? theme.personal : theme.business;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.subCatChip,
                      isSelected && { backgroundColor: activeColor + '25', borderColor: activeColor },
                    ]}
                    onPress={() => setSubCategory(cat)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.subCatText, isSelected && { color: activeColor }]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Açıklama */}
            <Text style={styles.sectionLabel}>Açıklama (İsteğe bağlı)</Text>
            <TextInput
              style={styles.descriptionInput}
              placeholder="Harcama detayı..."
              placeholderTextColor={theme.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
            />
          </ScrollView>

          {/* Kaydet Butonu */}
          <TouchableOpacity
            style={[
              styles.saveButton,
              (!amount || parseFloat(amount) <= 0 || !subCategory) && styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={!amount || parseFloat(amount) <= 0 || !subCategory}
            activeOpacity={0.8}
          >
            <MaterialIcons name="check" size={22} color="#FFF" />
            <Text style={styles.saveButtonText}>Kaydet</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContainer: {
    backgroundColor: theme.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 34,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    color: theme.text,
    fontSize: 22,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  amountSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    paddingVertical: 16,
    backgroundColor: theme.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.border,
  },
  currencySign: {
    color: theme.primary,
    fontSize: 36,
    fontWeight: 'bold',
    marginRight: 8,
  },
  amountInput: {
    color: theme.text,
    fontSize: 36,
    fontWeight: 'bold',
    minWidth: 100,
    textAlign: 'center',
  },
  sectionLabel: {
    color: theme.textMuted,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: theme.surface,
    borderWidth: 1.5,
    borderColor: theme.border,
  },
  typeText: {
    color: theme.textMuted,
    fontSize: 15,
    fontWeight: '600',
  },
  subCatGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  subCatChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: theme.surface,
    borderWidth: 1.5,
    borderColor: theme.border,
  },
  subCatText: {
    color: theme.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  descriptionInput: {
    backgroundColor: theme.surface,
    borderRadius: 14,
    padding: 16,
    color: theme.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 24,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: theme.primary,
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.4,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
});
