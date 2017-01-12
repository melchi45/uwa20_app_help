"use strict";
function H264SPSParser() {
  var vBitCount=0;
  var spsMap = null;
  function Constructor() {
    vBitCount = 0;
    spsMap = new Map();
  }

  function get_bit(base, offset) {
    var vCurBytes = (vBitCount+offset)>>3;  
    offset = (vBitCount+offset) & 0x00000007;
    return (((base[(vCurBytes)])) >> (0x7 - (offset & 0x7))) & 0x1;
  }

  function read_bits(pBuf, vReadBits) {
    var vCurBytes = vBitCount/8;
    var vCurBits = vBitCount%8;
    var vOffset=0;
    var vTmp=0, vTmp2=0;

    if(vReadBits == 1) {
      vTmp = get_bit(pBuf, vOffset);
    } else {
      for(var i=0;i<vReadBits;i++) {
        vTmp2 =  get_bit(pBuf, i) ;
        vTmp = (vTmp << 1) + vTmp2;
      }
    }

    vBitCount += vReadBits;  
    return vTmp;
  }

  function ue(base, offset) {
    var zeros = 0, vTmp = 0, vReturn = 0;
    var vIdx = offset;
    do {
      vTmp = get_bit(base, vIdx++);
      if(vTmp==0)
        zeros++;
    } while (0 == vTmp);

    if(zeros==0) {
      vBitCount += 1;
      return 0;
    }

    vReturn = 1 << zeros;

    for (var i = zeros - 1; i >= 0; i--, vIdx++) {
      vTmp = get_bit(base, vIdx);
      vReturn |= vTmp << i; 
    }   

    vBitCount += zeros*2 + 1;    

    return (vReturn - 1);
  }

  function se(base, offset) {
    var vReturn = ue(base, offset);

    if(vReturn & 0x1) {
      return (vReturn + 1) / 2;
    } else {
      return -vReturn / 2;
    }
  }

  function byte_aligned() {
    if((vBitCount&0x00000007)==0) 
      return 1;
    else
      return 0;
  }

  function hrd_parameters(pSPSBytes) {
    spsMap.put("cpb_cnt_minus1", ue(pSPSBytes, 0));
    spsMap.put("bit_rate_scale", read_bits(pSPSBytes, 4));
    spsMap.put("cpb_size_scale", read_bits(pSPSBytes, 4));
    var cpd_cnt_munus1 = spsMap.get("cpb_cnt_minus1");
    var bit_rate_value_minus1 = new Array(cpd_cnt_munus1);
    var cpb_size_value_minus1 = new Array(cpd_cnt_munus1);
    var cbr_flag = new Array(cpd_cnt_munus1);
    for (var i = 0; i <= cpd_cnt_munus1; i++) {
      bit_rate_value_minus1[i] = ue(pSPSBytes, 0);
      cpb_size_value_minus1[i] = ue(pSPSBytes, 0);
      cbr_flag[i] = read_bits(pSPSBytes, 1);
    }
    spsMap.put("bit_rate_value_minus1", bit_rate_value_minus1);
    spsMap.put("cpb_size_value_minus1", cpb_size_value_minus1);
    spsMap.put("cbr_flag", cbr_flag);

    spsMap.put("initial_cpb_removal_delay_length_minus1", read_bits(pSPSBytes, 4));
    spsMap.put("cpb_removal_delay_length_minus1", read_bits(pSPSBytes, 4));
    spsMap.put("dpb_output_delay_length_minus1", read_bits(pSPSBytes, 4));
    spsMap.put("time_offset_length", read_bits(pSPSBytes, 4));
  }

  function vui_parameters(pSPSBytes) {
    spsMap.put("aspect_ratio_info_present_flag", read_bits(pSPSBytes, 1));
    if (spsMap.get("aspect_ratio_info_present_flag")) {
      spsMap.put("aspect_ratio_idc", read_bits(pSPSBytes, 8));
      //Extended_SAR
      if (spsMap.get("aspect_ratio_idc") == 255) {
        spsMap.put("sar_width", read_bits(pSPSBytes, 16));
        spsMap.put("sar_height", read_bits(pSPSBytes, 16));
      }
    }

    spsMap.put("overscan_info_present_flag", read_bits(pSPSBytes, 1));
    if (spsMap.get("overscan_info_present_flag")) {
      spsMap.put("overscan_appropriate_flag", read_bits(pSPSBytes, 1));
    }
    spsMap.put("video_signal_type_present_flag", read_bits(pSPSBytes, 1));
    if (spsMap.get("video_signal_type_present_flag")) {
      spsMap.put("video_format", read_bits(pSPSBytes, 3));
      spsMap.put("video_full_range_flag", read_bits(pSPSBytes, 1));
      spsMap.put("colour_description_present_flag", read_bits(pSPSBytes, 1));
      if (spsMap.get("colour_description_present_flag")) {
        spsMap.put("colour_primaries", read_bits(pSPSBytes, 8));
        spsMap.put("transfer_characteristics", read_bits(pSPSBytes, 8));
        spsMap.put("matrix_coefficients", read_bits(pSPSBytes, 8));
      }
    }
    spsMap.put("chroma_loc_info_present_flag", read_bits(pSPSBytes, 1));
    if (spsMap.get("chroma_loc_info_present_flag")) {
      spsMap.put("chroma_sample_loc_type_top_field", ue(pSPSBytes, 0));
      spsMap.put("chroma_sample_loc_type_bottom_field", ue(pSPSBytes, 0));
    }
    spsMap.put("timing_info_present_flag", read_bits(pSPSBytes, 1));
    if (spsMap.get("timing_info_present_flag")) {
      spsMap.put("num_units_in_tick", read_bits(pSPSBytes, 32));
      spsMap.put("time_scale", read_bits(pSPSBytes, 32));
      spsMap.put("fixed_frame_rate_flag", read_bits(pSPSBytes, 1));
    }
    spsMap.put("nal_hrd_parameters_present_flag", read_bits(pSPSBytes, 1));
    if (spsMap.get("nal_hrd_parameters_present_flag")) {
      hrd_parameters(pSPSBytes);
    }
    spsMap.put("vcl_hrd_parameters_present_flag", read_bits(pSPSBytes, 1));
    if (spsMap.get("vcl_hrd_parameters_present_flag")) {
      hrd_parameters(pSPSBytes);
    }
    if (spsMap.get("nal_hrd_parameters_present_flag") || spsMap.get("vcl_hrd_parameters_present_flag")) {
      spsMap.put("low_delay_hrd_flag", read_bits(pSPSBytes, 1));
    }
    spsMap.put("pic_struct_present_flag", read_bits(pSPSBytes, 1));
    spsMap.put("bitstream_restriction_flag", read_bits(pSPSBytes, 1));
    if (spsMap.get("bitstream_restriction_flag")) {
      spsMap.put("motion_vectors_over_pic_boundaries_flag", read_bits(pSPSBytes, 1));
      spsMap.put("max_bytes_per_pic_denom", ue(pSPSBytes, 0));
      spsMap.put("max_bits_per_mb_denom", ue(pSPSBytes, 0));
      spsMap.put("log2_max_mv_length_horizontal", ue(pSPSBytes, 0));
      spsMap.put("log2_max_mv_length_vertical", ue(pSPSBytes, 0));
      spsMap.put("max_num_reorder_frames", ue(pSPSBytes, 0));
      spsMap.put("max_dec_frame_buffering", ue(pSPSBytes, 0));
    }      
  }

  Constructor.prototype = {
    parse: function (pSPSBytes)
    {
      //console.log("=========================SPS START=========================");
      vBitCount = 0;
      spsMap.clear();

      // forbidden_zero_bit, nal_ref_idc, nal_unit_type
      spsMap.put("forbidden_zero_bit", read_bits(pSPSBytes, 1));
      spsMap.put("nal_ref_idc", read_bits(pSPSBytes, 2));
      spsMap.put("nal_unit_type", read_bits(pSPSBytes, 5));

      // profile_idc
      spsMap.put("profile_idc", read_bits(pSPSBytes, 8));      
      spsMap.put("profile_compatibility", read_bits(pSPSBytes, 8));      

      // spsMap.put("constrained_set0_flag", read_bits(pSPSBytes, 1));
      // spsMap.put("constrained_set1_flag", read_bits(pSPSBytes, 1));
      // spsMap.put("constrained_set2_flag", read_bits(pSPSBytes, 1));
      // spsMap.put("constrained_set3_flag", read_bits(pSPSBytes, 1));
      // spsMap.put("constrained_set4_flag", read_bits(pSPSBytes, 1));
      // spsMap.put("constrained_set5_flag", read_bits(pSPSBytes, 1));
      // spsMap.put("reserved_zero_2bits", read_bits(pSPSBytes, 2));

      // level_idc
      spsMap.put("level_idc", read_bits(pSPSBytes, 8));
      spsMap.put("seq_parameter_set_id", ue(pSPSBytes, 0));

      var profile_idc = spsMap.get("profile_idc");
      if((profile_idc==100)||(profile_idc==110)||(profile_idc==122)||
        (profile_idc==244)||(profile_idc==44)||(profile_idc==83)||
        (profile_idc==86)||(profile_idc==118)||(profile_idc==128)||
        (profile_idc==138)||(profile_idc==139)||(profile_idc==134)) {
        spsMap.put("chroma_format_idc", ue(pSPSBytes, 0));
      if (spsMap.get("chroma_format_idc") == 3) {
        spsMap.put("separate_colour_plane_flag", read_bits(pSPSBytes, 1));
      }

      spsMap.put("bit_depth_luma_minus8", ue(pSPSBytes, 0));
      spsMap.put("bit_depth_chroma_minus8", ue(pSPSBytes, 0));
      spsMap.put("qpprime_y_zero_transform_bypass_flag", read_bits(pSPSBytes, 1));
      spsMap.put("seq_scaling_matrix_present_flag", read_bits(pSPSBytes, 1));

      if (spsMap.get("seq_scaling_matrix_present_flag")) {
        var num = spsMap.get("chroma_format_idc") != 3 ? 8 : 12;
        var seq_scaling_list_present_flag = new Array(num);
        for (var i = 0; i < num; i++) {
          seq_scaling_list_present_flag[i] = read_bits(pSPSBytes, 1);

          if (seq_scaling_list_present_flag[i]) {
            var sl_n = i < 6 ? 16 : 64;
            var lastScale = 8;
            var nextScale = 8;
            var delta_scale;
            var useDefaultScalingMatrixFlag;
            var scalingList = new Array(sl_n);

            for (var j = 0; j < sl_n; j++) {
              if (nextScale) {
                delta_scale = se(pSPSBytes, 0);
                nextScale = ( lastScale + delta_scale + 256 ) % 256;
              }
              lastScale = ( nextScale == 0 ) ? lastScale : nextScale;
            }
          }
        }
        spsMap.put("seq_scaling_list_present_flag", seq_scaling_list_present_flag);
      }
    }
    spsMap.put("log2_max_frame_num_minus4", ue(pSPSBytes, 0));
    spsMap.put("pic_order_cnt_type", ue(pSPSBytes, 0));

    if(spsMap.get("pic_order_cnt_type") == 0) {
      spsMap.put("log2_max_pic_order_cnt_lsb_minus4", ue(pSPSBytes, 0));
    } else if(spsMap.get("pic_order_cnt_type")==1) {
      spsMap.put("delta_pic_order_always_zero_flag", read_bits(pSPSBytes, 1));
      spsMap.put("offset_for_non_ref_pic", se(pSPSBytes, 0));
      spsMap.put("offset_for_top_to_bottom_field", se(pSPSBytes, 0));
      spsMap.put("num_ref_frames_in_pic_order_cnt_cycle", ue(pSPSBytes, 0));
      for(var i=0;i<spsMap.get("num_ref_frames_in_pic_order_cnt_cycle");i++) {
        spsMap.put("num_ref_frames_in_pic_order_cnt_cycle", se(pSPSBytes, 0));
      }
    }
    spsMap.put("num_ref_frames", ue(pSPSBytes, 0));
    spsMap.put("gaps_in_frame_num_value_allowed_flag", read_bits(pSPSBytes, 1));
    spsMap.put("pic_width_in_mbs_minus1", ue(pSPSBytes, 0));
    spsMap.put("pic_height_in_map_units_minus1", ue(pSPSBytes, 0));           
    spsMap.put("frame_mbs_only_flag", read_bits(pSPSBytes, 1));

    if(spsMap.get("frame_mbs_only_flag") == 0) {
      spsMap.put("mb_adaptive_frame_field_flag", read_bits(pSPSBytes, 1));
    }
    spsMap.put("direct_8x8_interence_flag", read_bits(pSPSBytes, 1));
    spsMap.put("frame_cropping_flag", read_bits(pSPSBytes, 1));
    if(spsMap.get("frame_cropping_flag")==1) {
      spsMap.put("frame_cropping_rect_left_offset", ue(pSPSBytes, 0));
      spsMap.put("frame_cropping_rect_right_offset", ue(pSPSBytes, 0));
      spsMap.put("frame_cropping_rect_top_offset", ue(pSPSBytes, 0));
      spsMap.put("frame_cropping_rect_bottom_offset", ue(pSPSBytes, 0));
    }

    //vui parameters
    spsMap.put("vui_parameters_present_flag", read_bits(pSPSBytes, 1));
    if (spsMap.get("vui_parameters_present_flag")) {
      vui_parameters(pSPSBytes);
    }

    //console.log("=========================SPS END=========================");


      return true;
    },
    getSizeInfo: function() {
      var SubWidthC = 0;
      var SubHeightC = 0;

      if (spsMap.get("chroma_format_idc") == 0 /*&& spsMap.get("separate_colour_plane_flag") == 0*/) { //monochrome
        SubWidthC = SubHeightC = 0;
      }
      else if (spsMap.get("chroma_format_idc") == 1 /*&& spsMap.get("separate_colour_plane_flag") == 0*/) { //4:2:0 
        SubWidthC = SubHeightC = 2;
      }
      else if (spsMap.get("chroma_format_idc") == 2 /*&& spsMap.get("separate_colour_plane_flag") == 0*/) { //4:2:2 
        SubWidthC = 2;
        SubHeightC = 1;
      }
      else if (spsMap.get("chroma_format_idc") == 3) { //4:4:4
        if (spsMap.get("separate_colour_plane_flag") == 0) {
          SubWidthC = SubHeightC = 1;
        }
        else if (spsMap.get("separate_colour_plane_flag") == 1) {
          SubWidthC = SubHeightC = 0;
        }
      }

      var PicWidthInMbs = spsMap.get("pic_width_in_mbs_minus1") + 1;

      var PicHeightInMapUnits = spsMap.get("pic_height_in_map_units_minus1") + 1;
      var FrameHeightInMbs = (2 - spsMap.get("frame_mbs_only_flag")) * PicHeightInMapUnits;

      var crop_left = 0;
      var crop_right = 0;
      var crop_top = 0;
      var crop_bottom = 0;

      if (spsMap.get("frame_cropping_flag") == 1) {
        crop_left = spsMap.get("frame_cropping_rect_left_offset");
        crop_right = spsMap.get("frame_cropping_rect_right_offset");
        crop_top = spsMap.get("frame_cropping_rect_top_offset");
        crop_bottom = spsMap.get("frame_cropping_rect_bottom_offset");
      }
      var decodeSize = (PicWidthInMbs * 16) * (FrameHeightInMbs * 16);
      var width = PicWidthInMbs * 16 - SubWidthC * (crop_left + crop_right);
      var height = FrameHeightInMbs * 16 - SubHeightC * (2 - spsMap.get("frame_mbs_only_flag")) * (crop_top + crop_bottom);

      var sizeInfo = {
        'width': width,
        'height': height,
        'decodeSize' : decodeSize
      };

      return sizeInfo;
    },
    getSpsValue: function(key) {
      return spsMap.get(key);
    },
    getCodecInfo: function() {
      var profile_idc = spsMap.get("profile_idc").toString(16);
      var profile_compatibility = spsMap.get("profile_compatibility") < 15 ?
        "0" + spsMap.get("profile_compatibility").toString(16) : spsMap.get("profile_compatibility").toString(16);
      var level_idc = spsMap.get("level_idc").toString(16);

      //console.log("getCodecInfo = " + (profile_idc + profile_compatibility + level_idc));
      return profile_idc + profile_compatibility + level_idc;

    }
  };
  return new Constructor();
}