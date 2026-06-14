import { statisticsStyles } from './statistics.styles';
import { manageProfilesStyles } from './manageProfiles.styles';
import { commonStyles } from '../common';

export const manageStatisticsStyles = {
  ...statisticsStyles,
  filterCardContent: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 3,
    alignItems: 'flex-end',
  },
  periodFields: {
    flex: 1,
    minWidth: 280,
  },
  exportButton: {
    ...commonStyles.primaryButton,
    px: 3,
    height: '56px',
    alignSelf: 'flex-end',
  },
  searchBarContainer: manageProfilesStyles.searchBarContainer,
  searchField: manageProfilesStyles.searchField,
  searchIcon: manageProfilesStyles.searchIcon,
  sidebarFilterCard: manageProfilesStyles.filterCard,
  filterHeader: manageProfilesStyles.filterHeader,
  filterIcon: manageProfilesStyles.filterIcon,
  filterTitle: manageProfilesStyles.filterTitle,
  filterLabel: manageProfilesStyles.filterLabel,
  filterOutlineBtn: manageProfilesStyles.filterOutlineBtn,
  filterActiveBtn: manageProfilesStyles.filterActiveBtn,
  selectInput: manageProfilesStyles.selectInput,
  filterRoleBtn: manageProfilesStyles.filterRoleBtn,
  filterRoleActiveBtn: manageProfilesStyles.filterRoleActiveBtn,
  paginationContainer: manageProfilesStyles.paginationContainer,
  pageBtn: manageProfilesStyles.pageBtn,
  activePageBtn: manageProfilesStyles.activePageBtn,
  pageEllipsis: manageProfilesStyles.pageEllipsis,
  tableCellCurator: {
    fontWeight: 600,
    color: statisticsStyles.tableCellType.color,
  },
  tableCellCount: {
    fontWeight: 600,
    color: statisticsStyles.tableCellNumber.color,
    textAlign: 'center',
  },
};
