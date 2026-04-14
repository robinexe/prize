import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../theme';
import { reservationsApi, boatsApi } from '../../services/api';
import { StatusBadge } from '../../components/ui';

const dayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function CalendarScreen() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const today = new Date();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

  const loadReservations = async () => {
    try {
      const { data } = await reservationsApi.myReservations();
      setReservations(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error('Error loading reservations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadReservations(); }, []);

  const getReservationsForDay = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    return reservations.filter((r: any) => {
      const start = new Date(r.startDate);
      const end = new Date(r.endDate);
      return date >= new Date(start.getFullYear(), start.getMonth(), start.getDate()) &&
             date <= new Date(end.getFullYear(), end.getMonth(), end.getDate());
    });
  };

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
    else setCurrentMonth(currentMonth - 1);
  };

  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
    else setCurrentMonth(currentMonth + 1);
  };

  const renderCalendar = () => {
    const cells = [];
    for (let i = 0; i < firstDayOfWeek; i++) cells.push(<View key={`empty-${i}`} style={styles.dayCell} />);
    for (let d = 1; d <= daysInMonth; d++) {
      const isToday = d === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
      const dayReservations = getReservationsForDay(d);
      const hasMine = dayReservations.length > 0;
      const isSelected = d === selectedDate;
      cells.push(
        <TouchableOpacity
          key={d}
          onPress={() => setSelectedDate(d)}
          style={[styles.dayCell, isToday && styles.today, isSelected && styles.selected, hasMine && !isSelected && styles.myReservation]}
        >
          <Text style={[styles.dayText, (isSelected || hasMine) && { color: '#fff' }]}>{d}</Text>
          {hasMine && !isSelected && <View style={styles.dot} />}
        </TouchableOpacity>
      );
    }
    return cells;
  };

  const selectedDayReservations = selectedDate ? getReservationsForDay(selectedDate) : [];
  const monthName = new Date(currentYear, currentMonth).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={false} onRefresh={loadReservations} tintColor={theme.colors.primary} />}
    >
      <View style={{ paddingTop: 60 }}>
        <Text style={styles.title}>Agenda</Text>
      </View>

      <View style={styles.monthNav}>
        <TouchableOpacity onPress={prevMonth}><Text style={styles.navArrow}>◀</Text></TouchableOpacity>
        <Text style={styles.monthLabel}>{monthName}</Text>
        <TouchableOpacity onPress={nextMonth}><Text style={styles.navArrow}>▶</Text></TouchableOpacity>
      </View>

      <View style={styles.calendarCard}>
        <View style={styles.weekRow}>
          {dayLabels.map((d) => <Text key={d} style={styles.weekDay}>{d}</Text>)}
        </View>
        <View style={styles.daysGrid}>{renderCalendar()}</View>
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.colors.primary }]} />
          <Text style={styles.legendText}>Minha reserva</Text>
        </View>
      </View>

      {selectedDate && selectedDayReservations.length > 0 && (
        <View>
          <Text style={styles.sectionTitle}>Reservas em {selectedDate}/{currentMonth + 1}</Text>
          {selectedDayReservations.map((r: any) => (
            <View key={r.id} style={styles.reservationCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.reservationBoat}>{r.boat?.name || 'Embarcação'}</Text>
                <StatusBadge status={r.status} />
              </View>
              <Text style={styles.reservationDate}>
                {new Date(r.startDate).toLocaleDateString('pt-BR')} — {new Date(r.endDate).toLocaleDateString('pt-BR')}
              </Text>
              {r.notes && <Text style={styles.reservationNotes}>{r.notes}</Text>}
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity style={styles.reserveBtn} onPress={() => router.push('/new-reservation')}>
        <Text style={styles.reserveBtnText}>+ Nova Reserva</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 20 },
  title: { fontSize: 24, fontWeight: '700', color: '#1e293b' },
  monthNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 16 },
  navArrow: { fontSize: 18, color: theme.colors.primary, padding: 8 },
  monthLabel: { fontSize: 16, fontWeight: '600', color: '#1e293b', textTransform: 'capitalize' },
  calendarCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  weekRow: { flexDirection: 'row', marginBottom: 8 },
  weekDay: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '600', color: '#94a3b8' },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: '14.28%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 12 },
  dayText: { fontSize: 14, fontWeight: '500', color: '#1e293b' },
  today: { borderWidth: 2, borderColor: theme.colors.primary },
  selected: { backgroundColor: theme.colors.secondary },
  myReservation: { backgroundColor: theme.colors.primary },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#fff', marginTop: 2 },
  legend: { flexDirection: 'row', gap: 20, marginTop: 16, marginBottom: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: '#64748b' },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1e293b', marginTop: 16, marginBottom: 10 },
  reservationCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 1 },
  reservationBoat: { fontSize: 15, fontWeight: '600', color: '#1e293b' },
  reservationDate: { fontSize: 13, color: '#64748b', marginTop: 6 },
  reservationNotes: { fontSize: 13, color: '#94a3b8', marginTop: 4, fontStyle: 'italic' },
  reserveBtn: { backgroundColor: theme.colors.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 16 },
  reserveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
