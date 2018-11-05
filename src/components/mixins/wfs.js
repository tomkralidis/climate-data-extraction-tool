/*
Anything common to WFS query UI goes here with default values provided in data()
*/
export const wfs = {
  data () {
    return {
      wfs_format: 'geojson',
      bbox_parts: {
        min_x: 0,
        min_y: 0,
        max_x: 0,
        max_y: 0
      },
      wfs_province: 'null',
      wfs_layer: null,
      wfs_layer_station: null,
      wfs_selected_station_ids: [],
      wfs_station_limit: 9999,
      wfs_limit: 999999,
      wfs_max_limit: 999999,
      wfs_min_limit: 1,
      date_start: null,
      date_end: null,
      datasetToStnColName: {
        ahccd: 'station_id__id_station',
        hydrometric: 'STATION_NUMBER',
        normals: 'STN_ID',
        daily: 'STN_ID',
        monthly: 'STN_ID'
      },
      datasetToProvColName: {
        ahccd: 'province__province',
        hydrometric: 'PROV_TERR_STATE_LOC',
        normals: 'PROVINCE_CODE',
        daily: 'PROVINCE_CODE',
        monthly: 'PROVINCE_CODE'
      }
    }
  },
  computed: {
    getProvince: function () {
      return this.$store.getters.getProvince
    },
    dateConfigs: function () {
      if (this.wfs_layer === 'climate-monthly') {
        return {
          minimumView: 'month',
          format: 'YYYY-MM',
          placeholder: 'YYYY-MM'
        }
      } else {
        return {
          minimumView: 'day',
          format: 'YYYY-MM-DD',
          placeholder: 'YYYY-MM-DD'
        }
      }
    },
    dateMoment: function () {
      return {
        min: this.$moment.utc(this.date_min),
        max: this.$moment.utc(this.date_max)
      }
    },
    dateStartEmpty: function () {
      return this.date_start === null || this.date_start === 'Invalid date'
    },
    dateEndEmpty: function () {
      return this.date_end === null || this.date_end === 'Invalid date'
    },
    dateRangeHasNull: function () {
      return this.dateStartEmpty || this.dateEndEmpty
    },
    dateStartIsEmptyOnly: function () {
      if (this.dateStartEmpty && !this.dateEndEmpty) {
        return true
      } else {
        return false
      }
    },
    dateEndIsEmptyOnly: function () {
      if (this.dateEndEmpty && !this.dateStartEmpty) {
        return true
      } else {
        return false
      }
    },
    dateRangeErrorMessage: function () {
      if (this.dateStartIsEmptyOnly || this.dateEndIsEmptyOnly) {
        return this.$gettext('Date range fields must be all set or cleared.')
      }
      if (this.dateRangeHasBadRange) {
        return this.$gettext('The start date cannot be greater than the end date.')
      }
      return '' // no errors
    },
    temporal: function () {
      if (this.dateRangeIsValid) {
        if (this.hasInvalidMomentDate) {
          return null
        } else {
          var format = this.dateConfigs.format
          var start = this.$moment.utc(this.date_start).format(format)
          var end = this.$moment.utc(this.date_end).format(format)
          if (this.wfs_layer === 'climate-daily') {
            // format = 'YYYY-MM-DD HH:mm:ss'
            start += ' 00:00:00'
            end += ' 00:00:00'
          }
          return 'time=' + start + '/' + end
        }
      } else {
        return null
      }
    },
    hasInvalidMomentDate: function () {
      var format = this.dateConfigs.format
      var start = this.$moment.utc(this.date_start, format).format(format)
      var end = this.$moment.utc(this.date_end, format).format(format)

      return (start === 'Invalid date' || end === 'Invalid date')
    },
    dateRangeIsValid: function () {
      if (this.hasInvalidMomentDate) {
        return false
      } else if (this.dateRangeHasNull) { // Date range is valid enough to generate a date range string
        return false
      } else {
        return true
      }
    },
    datesCleared: function () {
      return this.dateStartEmpty && this.dateEndEmpty
    },
    dateRangeHasBadRange: function () {
      if (this.datesCleared) { // don't determine bad range if dates are cleared
        return false
      } else if (this.$moment.utc(this.date_end, this.dateConfigs.format).format('YYYY-MM-DD') <= this.$moment.utc(this.date_start, this.dateConfigs.format).format('YYYY-MM-DD')) {
        return true
      } else {
        return false
      }
    },
    dateRangePastLimits: function () {
      var start = this.$moment.utc(this.date_start)
      var end = this.$moment.utc(this.date_end)
      var minimumView = this.dateConfigs.minimumView

      return start.isBefore(this.date_min, minimumView) ||
        start.isAfter(this.date_max, minimumView) ||
        end.isBefore(this.date_min, minimumView) ||
        end.isAfter(this.date_max, minimumView)
    },
    hasErrors: function () {
      return this.dateRangeHasBadRange ||
        this.dateRangePastLimits ||
        this.dateStartIsEmptyOnly ||
        this.dateEndIsEmptyOnly
    },
    spatialSelectPriority: function () {
      // Determines spatial selection priority: point, province, bbox
      if (this.wfs_province !== 'null') {
        return 'province'
      } else if (this.wfs_selected_station_ids.length > 0) {
        return 'station'
      } else if (this.ows_bbox !== null) {
        return 'bbox'
      } else {
        return true
      }
    },
    stationsSelected: function () {
      return this.wfs_selected_station_ids.length > 0
    },
    provinceSelected: function () {
      return this.wfs_province !== 'null'
    },
    layer_options: function () {
      var layers = {}
      layers[this.wfs_layer] = this.currentRouteTitle
      return layers
    }
  },
  methods: {
    splitBBOXString: function (event) {
      var bboxSplit = this.ows_bbox.split(',')
      this.bbox_parts.min_x = bboxSplit[0]
      this.bbox_parts.min_y = bboxSplit[1]
      this.bbox_parts.max_x = bboxSplit[2]
      this.bbox_parts.max_y = bboxSplit[3]
    },
    generateWFSBBOXParam: function () {
      return '&BBOX=' + this.ows_bbox
    },
    clearDates: function (evt) {
      this.date_start = null
      this.date_end = null
    },
    wfs3_download_url: function (layerName) {
      var url = this.wfs3_url_base
      var urlParams = []
      url += '/' + layerName
      url += '/items?'

      // temporal
      if (this.temporal !== null) {
        urlParams.push(this.temporal)
      }

      // Spatial selection priority: station, province, bbox
      switch (this.spatialSelectPriority) {
        case 'station':
          var stnColName = this.datasetToStnColName[this.$route.name]
          urlParams.push(stnColName + '=' + this.wfs_selected_station_ids.join('|'))
          break
        case 'province':
          var provColName = this.datasetToProvColName[this.$route.name]
          urlParams.push(provColName + '=' + this.wfs_province)
          break
        case 'bbox':
          urlParams.push('bbox=' + this.ows_bbox)
          break
        default:
          // No spatial query applied
      }

      // Limit validation
      if (this.wfs_limit >= this.wfs_min_limit && this.wfs_limit <= this.wfs_max_limit) {
        if (this.wfs_limit !== '') {
          urlParams.push('limit=' + this.wfs_limit)
        }
      }

      // format selection
      if (this.wfs_format !== 'geojson') { // default is geoJSON
        urlParams.push('f=' + this.wfs_format)
      }

      url += urlParams.join('&')
      return url
    }
  }
}
