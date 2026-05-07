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
  Alert,
} from 'react-native';
import { theme } from '../theme/colors';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import useStore from '../store/useStore';

export const OffsetModal = ({ visible, onClose }) => {
  const { wallets, addOffsetPhysical, addOffsetVirtual, netBalance } = useStore();

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [method, setMethod] = useState('physical'); // 'physical' | 'virtual'
  const [selectedWalletId, setSelectedWalletId] = useState(null);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const personalWallets = wallets.filter(w => w.owner === 'Personal');

  const handleSave = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Hata', 'Lütfen geçerli bir tutar giriniz.');
      return;
    }

    try {
      if (method === 'physical') {
        if (!selectedWalletId) {
          Alert.alert('Hata', 'Lütfen ödemenin alınacağı cüzdanı seçiniz.');
          return;
        }
        await addOffsetPhysical(parseFloat(amount), selectedWalletId, description, date.toISOString());
      } else {
        await addOffsetVirtual(parseFloat(amount), description, date.toISOString());
      }

      setAmount('');
      setDescription('');
      setDate(new Date());
      onClose();
    } catch (error) {
      Alert.alert('Hata', 'İşlem kaydedilirken bir sorun oluştu.');
    }
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const isOwed = netBalance >= 0;

  return (
    <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Mahsuplaşma / Ödeme</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>{isOwed ? 'Şirketten Alacak' : 'Şirkete Borç'}</Text>
            <Text style={[styles.infoValue, { color: isOwed ? theme.secondary : theme.danger }]}>
              {Math.abs(netBalance).toFixed(2)} ₺
            </Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionLabel}>Tutar</Text>
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

            <Text style={styles.sectionLabel}>Tarih</Text>
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

            <Text style={styles.sectionLabel}>İşlem Yöntemi</Text>
            <View style={styles.methodRow}>
              <TouchableOpacity
                style={[styles.methodButton, method === 'physical' && styles.activeMethod]}
                onPress={() => setMethod('physical')}
              >
                <MaterialIcons name="payments" size={20} color={method === 'physical' ? theme.primary : theme.textMuted} />
                <Text style={[styles.methodText, method === 'physical' && { color: theme.primary }]}>Fiziksel Ödeme</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.methodButton, method === 'virtual' && styles.activeMethod]}
                onPress={() => setMethod('virtual')}
              >
                <MaterialIcons name="account-balance" size={20} color={method === 'virtual' ? theme.primary : theme.textMuted} />
                <Text style={[styles.methodText, method === 'virtual' && { color: theme.primary }]}>Sanal (Maaş vb.)</Text>
              </TouchableOpacity>
            </View>

            {method === 'physical' && (
              <>
                <Text style={styles.sectionLabel}>Para Hangi Cüzdana Girdi?</Text>
                <View style={styles.walletList}>
                  {personalWallets.map(w => (
                    <TouchableOpacity
                      key={w.id}
                      style={[styles.walletItem, selectedWalletId === w.id && styles.activeWallet]}
                      onPress={() => setSelectedWalletId(w.id)}
                    >
                      <MaterialIcons name={w.type === 'Cash' ? 'payments' : 'credit-card'} size={18} color={selectedWalletId === w.id ? '#FFF' : theme.textMuted} />
                      <Text style={[styles.walletText, selectedWalletId === w.id && { color: '#FFF' }]}>{w.name}</Text>
                      <Text style={[styles.walletBalance, selectedWalletId === w.id && { color: '#FFF' }]}>{w.balance.toFixed(2)} ₺</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            <Text style={styles.sectionLabel}>Açıklama</Text>
            <TextInput
              style={styles.input}
              placeholder="Örn: Nakit ödeme alındı, Maaştan düşüldü..."
              placeholderTextColor={theme.textMuted}
              value={description}
              onChangeText={setDescription}
            />
          </ScrollView>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>İşlemi Tamamla</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 },
  modalContainer: { backgroundColor: theme.background, borderRadius: 24, padding: 24, maxHeight: '80%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { color: theme.text, fontSize: 18, fontWeight: 'bold' },
  closeButton: { padding: 4 },
  infoBox: { backgroundColor: theme.surface, borderRadius: 16, padding: 16, alignItems: 'center', marginBottom: 20 },
  infoLabel: { color: theme.textMuted, fontSize: 12, textTransform: 'uppercase', marginBottom: 4 },
  infoValue: { fontSize: 24, fontWeight: 'bold' },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.border,
    gap: 12,
  },
  dateText: {
    color: theme.text,
    fontSize: 16,
  },
  sectionLabel: { color: theme.textMuted, fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 8, marginTop: 12 },
  amountSection: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surface, borderRadius: 12, padding: 12 },
  currencySign: { color: theme.primary, fontSize: 24, fontWeight: 'bold', marginRight: 8 },
  amountInput: { color: theme.text, fontSize: 24, fontWeight: 'bold', flex: 1 },
  methodRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  methodButton: {
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
  activeMethod: { borderColor: theme.primary, backgroundColor: theme.primary + '10' },
  methodText: { color: theme.textMuted, fontSize: 12, fontWeight: 'bold' },
  walletList: { gap: 8 },
  walletItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.surface,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  activeWallet: { backgroundColor: theme.primary, borderColor: theme.primary },
  walletText: { color: theme.text, flex: 1, fontSize: 14, fontWeight: '600' },
  walletBalance: { color: theme.textMuted, fontSize: 13 },
  input: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 12,
    color: theme.text,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 20,
  },
  saveButton: { backgroundColor: theme.primary, borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  saveButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});
