import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { theme } from '../theme/colors';
import useStore from '../store/useStore';

export const IncomeModal = ({ visible, onClose, wallet }) => {
  const { addIncomeTransaction, categories } = useStore();
  
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Hata', 'Lütfen geçerli bir miktar girin.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Find "Para Girişi" category or create a default one
      let incomeCat = categories.find(c => c.name === 'Para Girişi' || c.name === 'Gelir');
      if (!incomeCat) {
        // Fallback to the first category if not found
        incomeCat = categories.find(c => c.type === (wallet?.owner || 'Company')) || categories[0];
      }

      const transactionData = {
        date: date.toISOString(),
        amount: parseFloat(amount),
        wallet_id: wallet.id,
        category_id: incomeCat.id,
        project_id: null,
        city: null,
        description: description || 'Para Girişi / Avans',
        receipt_uri: null,
        is_offset_transaction: false,
        is_income: true,
      };

      await addIncomeTransaction(transactionData);
      
      setAmount('');
      setDescription('');
      setDate(new Date());
      onClose();
      Alert.alert('Başarılı', 'Para girişi kaydedildi.');
    } catch (error) {
      Alert.alert('Hata', 'İşlem kaydedilirken bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <View style={styles.header}>
            <Text style={styles.title}>{wallet?.name} - Para Girişi</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialIcons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form}>
            <Text style={styles.label}>Miktar (₺)</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor={theme.textMuted}
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
            />

            <Text style={styles.label}>Tarih</Text>
            <TouchableOpacity 
              style={styles.dateSelector} 
              onPress={() => setShowDatePicker(true)}
            >
              <MaterialIcons name="event" size={20} color={theme.primary} />
              <Text style={styles.dateText}>
                {date.toLocaleDateString('tr-TR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display="default"
                onChange={onDateChange}
              />
            )}

            <Text style={styles.label}>Açıklama</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Örn: Şantiye Avansı, Nakit Girişi"
              placeholderTextColor={theme.textMuted}
              multiline
              numberOfLines={3}
              value={description}
              onChangeText={setDescription}
            />

            <TouchableOpacity
              style={[styles.submitBtn, isSubmitting && styles.disabledBtn]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              <Text style={styles.submitBtnText}>
                {isSubmitting ? 'Kaydediliyor...' : 'Para Ekle'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: theme.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '70%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  title: {
    color: theme.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeBtn: {
    padding: 4,
  },
  form: {
    padding: 24,
  },
  label: {
    color: theme.textMuted,
    fontSize: 14,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 14,
    color: theme.text,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.border,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.border,
    gap: 12,
  },
  dateText: {
    color: theme.text,
    fontSize: 16,
  },
  submitBtn: {
    backgroundColor: theme.secondary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 40,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
