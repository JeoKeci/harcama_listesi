import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { theme } from '../theme/colors';
import useStore from '../store/useStore';
import { generateAndSharePDF } from '../services/pdfService';

export default function ReportScreen() {
  const { projects, getReportTransactions, netBalance } = useStore();
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [endDate, setEndDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(null); // 'start' | 'end'
  const [reports, setReports] = useState([]);

  React.useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const reportsDir = FileSystem.documentDirectory + 'reports/';
      const dirInfo = await FileSystem.getInfoAsync(reportsDir);
      if (dirInfo.exists) {
        const files = await FileSystem.readDirectoryAsync(reportsDir);
        const pdfFiles = files
          .filter(f => f.endsWith('.pdf'))
          .sort()
          .reverse(); // Newest first
        setReports(pdfFiles);
      }
    } catch (e) {
      console.error('Error loading reports:', e);
    }
  };

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      const transactions = await getReportTransactions(
        startDate.toISOString(),
        endDate.toISOString(),
        selectedProjectId
      );

      if (transactions.length === 0) {
        Alert.alert('Uyarı', 'Seçilen kriterlere uygun işlem bulunamadı.');
        return;
      }

      const projectName = selectedProjectId
        ? projects.find(p => p.id === selectedProjectId)?.name
        : 'Tüm Projeler';

      await generateAndSharePDF(transactions, {
        userName: 'Mühendis',
        projectName,
        netBalance,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
      
      await loadReports();
    } catch (error) {
      Alert.alert('Hata', 'Rapor oluşturulurken bir hata oluştu.');
    } finally {
      setIsGenerating(false);
    }
  };

  const openReport = async (fileName) => {
    const uri = FileSystem.documentDirectory + 'reports/' + fileName;
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri);
    }
  };

  const deleteReport = async (fileName) => {
    Alert.alert('Raporu Sil', 'Bu raporu silmek istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      { 
        text: 'Sil', 
        style: 'destructive', 
        onPress: async () => {
          await FileSystem.deleteAsync(FileSystem.documentDirectory + 'reports/' + fileName);
          loadReports();
        } 
      }
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Rapor Oluştur</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.label}>Tarih Aralığı</Text>
          <View style={styles.dateRow}>
            <TouchableOpacity style={styles.dateBtn} onPress={() => setShowPicker('start')}>
              <Text style={styles.dateBtnLabel}>Başlangıç</Text>
              <Text style={styles.dateBtnValue}>{startDate.toLocaleDateString('tr-TR')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dateBtn} onPress={() => setShowPicker('end')}>
              <Text style={styles.dateBtnLabel}>Bitiş</Text>
              <Text style={styles.dateBtnValue}>{endDate.toLocaleDateString('tr-TR')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {showPicker && (
          <DateTimePicker
            value={showPicker === 'start' ? startDate : endDate}
            mode="date"
            onChange={(e, date) => {
              setShowPicker(null);
              if (date) {
                if (showPicker === 'start') setStartDate(date);
                else setEndDate(date);
              }
            }}
          />
        )}

        <View style={styles.card}>
          <Text style={styles.label}>Proje Filtresi</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.projectScroll}>
            <TouchableOpacity
              style={[styles.projectChip, selectedProjectId === null && styles.activeProjectChip]}
              onPress={() => setSelectedProjectId(null)}
            >
              <Text style={[styles.projectChipText, selectedProjectId === null && styles.activeProjectChipText]}>
                Tüm Projeler
              </Text>
            </TouchableOpacity>
            {projects.map(p => (
              <TouchableOpacity
                key={p.id}
                style={[styles.projectChip, selectedProjectId === p.id && styles.activeProjectChip]}
                onPress={() => setSelectedProjectId(p.id)}
              >
                <Text style={[styles.projectChipText, selectedProjectId === p.id && styles.activeProjectChipText]}>
                  {p.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.infoCard}>
          <MaterialIcons name="info-outline" size={24} color={theme.primary} />
          <Text style={styles.infoText}>
            Rapor, seçilen projedeki tüm harcamaları, mahsuplaşmaları ve fiş fotoğraflarını içeren profesyonel bir PDF dosyası oluşturur.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.generateButton, isGenerating && { opacity: 0.7 }]}
          onPress={handleGenerate}
          disabled={isGenerating}
        >
          <MaterialIcons name="picture-as-pdf" size={24} color="#FFF" />
          <Text style={styles.generateText}>
            {isGenerating ? 'Oluşturuluyor...' : 'PDF Raporu Hazırla'}
          </Text>
        </TouchableOpacity>

        {/* Report History */}
        {reports.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.sectionTitle}>Geçmiş Raporlar</Text>
            {reports.map((report, idx) => (
              <View key={idx} style={styles.reportItem}>
                <TouchableOpacity style={styles.reportInfo} onPress={() => openReport(report)}>
                  <MaterialIcons name="insert-drive-file" size={24} color={theme.primary} />
                  <View>
                    <Text style={styles.reportName}>Rapor_{report.split('_')[1].split('.')[0]}</Text>
                    <Text style={styles.reportDate}>
                      {new Date(parseInt(report.split('_')[1])).toLocaleString('tr-TR')}
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteReport(report)}>
                  <MaterialIcons name="delete-outline" size={20} color={theme.danger} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { padding: 24, borderBottomWidth: 1, borderBottomColor: theme.border },
  title: { color: theme.text, fontSize: 20, fontWeight: 'bold' },
  content: { padding: 24, paddingBottom: 60 },
  card: { backgroundColor: theme.surface, borderRadius: 16, padding: 16, marginBottom: 16 },
  label: { color: theme.textMuted, fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 12 },
  dateRow: { flexDirection: 'row', gap: 12 },
  dateBtn: { flex: 1, backgroundColor: theme.surfaceLight + '40', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: theme.border },
  dateBtnLabel: { color: theme.textMuted, fontSize: 10, marginBottom: 4 },
  dateBtnValue: { color: theme.text, fontSize: 14, fontWeight: 'bold' },
  projectScroll: { flexDirection: 'row', gap: 8 },
  projectChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: theme.surfaceLight + '40', marginRight: 8, borderWidth: 1, borderColor: theme.border },
  activeProjectChip: { backgroundColor: theme.primary, borderColor: theme.primary },
  projectChipText: { color: theme.text, fontSize: 13 },
  activeProjectChipText: { color: '#FFF', fontWeight: 'bold' },
  infoCard: { flexDirection: 'row', backgroundColor: theme.surface, borderRadius: 16, padding: 16, gap: 12, marginBottom: 20 },
  infoText: { color: theme.textMuted, flex: 1, fontSize: 13, lineHeight: 18 },
  generateButton: {
    backgroundColor: theme.primary,
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    elevation: 4,
    marginBottom: 40,
  },
  generateText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  historySection: { marginTop: 20 },
  sectionTitle: { color: theme.text, fontSize: 16, fontWeight: 'bold', marginBottom: 16 },
  reportItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surface, padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: theme.border },
  reportInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  reportName: { color: theme.text, fontSize: 14, fontWeight: 'bold' },
  reportDate: { color: theme.textMuted, fontSize: 11 },
});
