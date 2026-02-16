export interface SensusFilterPanelProps {
  // umur
  rangeUmurMin: string;
  rangeUmurMax: string;
  setRangeUmurMin: (v: string) => void;
  setRangeUmurMax: (v: string) => void;

  // lokasi
  fetchDataDaerah: any[];
  balikanDataDesa: any[];
  balikanDataKelompok: any[];
  filterDaerah: any;
  filterDesa: any;
  filterKelompok: any;
  setFilterDaerah: (v: any) => void;
  setFilterDesa: (v: any) => void;
  setFilterKelompok: (v: any) => void;
  fetchDesa: (v: any) => void;
  fetchKelompok: (v: any) => void;
  setBalikanDataDesa: (v: any) => void;
  setBalikanDataKelompok: (v: any) => void;

  // status filters
  statusSambung: any;
  statusPernikahan: any;
  statusAtletAsad: any;
  statusGender: any;
  resultJenisData?: any;

  setStatusSambung: (v: any) => void;
  setStatusPernikahan: (v: any) => void;
  setStatusAtletAsad: (v: any) => void;
  setStatusGender: (v: any) => void;
  setResultJenisData?: any;

  statusFilterInfoSambung: any;
  statusFilterInfoPernikahan: any;
  statusFilterInfoAtletAsad: any;
  statusFilterInfoGender: any;
  statusFilterJenisData?: any;

  activeKey: string | null;
  setActiveKey: (v: string | null) => void;

  // auth
  dataLogin: any;
}

export interface UsersFilterPanelProps {
  // lokasi
  fetchDataDaerah: any[];
  balikanDataDesa: any[];
  balikanDataKelompok: any[];
  filterDaerah: any;
  filterDesa: any;
  filterKelompok: any;
  setFilterDaerah: (v: any) => void;
  setFilterDesa: (v: any) => void;
  setFilterKelompok: (v: any) => void;
  fetchDesa: (v: any) => void;
  fetchKelompok: (v: any) => void;
  setBalikanDataDesa: (v: any) => void;
  setBalikanDataKelompok: (v: any) => void;
  statusUsersOptions: any[];

  // status filters
  status: any;

  setStatus: (v: any) => void;

  activeKey: string | null;
  setActiveKey: (v: string | null) => void;

  // auth
  dataLogin: any;
}
