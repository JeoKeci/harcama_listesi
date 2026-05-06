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
import { theme } from '../theme/colors';
import useStore from '../store/useStore';
import { generateAndSharePDF } from '../services/pdfService';

export default function ReportScreen() {
  const { projects, getReportTransactions, netBalance } = useStore();
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      // For now, we fetch all transactions for the report (simple version)
      // Real app would have date range pickers here
      const transactions = await getReportTransactions(
        '2000-01-01',
        '2100-01-01',
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
      });
    } catch (error) {
      Alert.alert('Hata', 'Rapor oluşturulurken bir hata oluştu.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Rapor Oluştur</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.label}>Proje Filtresi</Text>
          <TouchableOpacity
            style={[styles.projectItem, selectedProjectId === null && styles.activeProject]}
            onPress={() => setSelectedProjectId(null)}
          >
            <Text style={[styles.projectText, selectedProjectId === null && styles.activeProjectText]}>
              Tüm Projeler
            </Text>
          </TouchableOpacity>
          {projects.map(p => (
            <TouchableOpacity
              key={p.id}
              style={[styles.projectItem, selectedProjectId === p.id && styles.activeProject]}
              onPress={() => setSelectedProjectId(p.id)}
            >
              <Text style={[styles.projectText, selectedProjectId === p.id && styles.activeProjectText]}>
                {p.name}
              </Text>
            </TouchableOpacity>
          ))}
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { padding: 24, borderBottomWidth: 1, borderBottomColor: theme.border },
  title: { color: theme.text, fontSize: 20, fontWeight: 'bold' },
  content: { padding: 24 },
  card: { backgroundColor: theme.surface, borderRadius: 16, padding: 16, marginBottom: 20 },
  label: { color: theme.textMuted, fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 12 },
  projectItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border },
  activeProject: { backgroundColor: theme.primary + '10' },
  projectText: { color: theme.text, fontSize: 15 },
  activeProjectText: { color: theme.primary, fontWeight: 'bold' },
  infoCard: { flexDirection: 'row', backgroundColor: theme.surface, borderRadius: 16, padding: 16, gap: 12, marginBottom: 32 },
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
  },
  generateText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});
