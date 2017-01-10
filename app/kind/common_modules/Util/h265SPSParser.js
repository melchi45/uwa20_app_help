"use strict"; 
/** 
 *  @const
 */

function H265SPSParser() {
    var vBitCount=0;

    function Constructor() {
        vBitCount = 0;
    }

    function get_bit(base, offset)
    {
       var vCurBytes = (vBitCount+offset)>>3;   
       offset = (vBitCount+offset) & 0x00000007;
       return (((base[(vCurBytes)])) >> (0x7 - (offset & 0x7))) & 0x1;
    }

    function read_bits(pBuf, vReadBits)
    {
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

    function ue(base, offset)
    {       
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
      
        // insert first 1 bit
        vReturn = 1 << zeros;
        
        for (var i = zeros - 1; i >= 0; i--, vIdx++) {
          vTmp = get_bit(base, vIdx);
          vReturn |= vTmp << i; 
        }   
       
       vBitCount += zeros*2 + 1;    
        
        return (vReturn - 1);
    }

    function se(base, offset)
    {       
      var vReturn = ue(base, offset);
       
      if(vReturn & 0x1) {
        return (vReturn + 1) / 2;
      } else {
        return -vReturn / 2;
      }
    }

    function byte_aligned()
    {
       if((vBitCount&0x00000007)==0) 
          return 1;
       else
          return 0;
    }

    function profile_tier_level(pSPSBytes, maxNumSubLayersMinus1) {      
      var general_profile_space = read_bits(pSPSBytes, 2);
      var general_tier_flag = read_bits(pSPSBytes, 1);
      var general_profile_idc = read_bits(pSPSBytes, 5);
      var general_profile_compatibility_flag = new Array(32);

      for(var j = 0; j < 32; j++ ) {
        general_profile_compatibility_flag[j] = read_bits(pSPSBytes, 1);
      }

      var general_progressive_source_flag = read_bits(pSPSBytes, 1);
      var general_interlaced_source_flag = read_bits(pSPSBytes, 1);
      var general_non_packed_constraint_flag = read_bits(pSPSBytes, 1);
      var general_frame_only_constraint_flag = read_bits(pSPSBytes, 1);

      if( general_profile_idc  ==  4  ||  general_profile_compatibility_flag[4]  ||
        general_profile_idc  ==  5  ||  general_profile_compatibility_flag[5]  ||
        general_profile_idc  ==  6  ||  general_profile_compatibility_flag[6]  ||
        general_profile_idc  ==  7  ||  general_profile_compatibility_flag[7] ) {
        var general_max_12bit_constraint_flag = read_bits(pSPSBytes, 1);
        var general_max_10bit_constraint_flag = read_bits(pSPSBytes, 1);
        var general_max_8bit_constraint_flag = read_bits(pSPSBytes, 1);
        var general_max_422chroma_constraint_flag = read_bits(pSPSBytes, 1);
        var general_max_420chroma_constraint_flag = read_bits(pSPSBytes, 1);
        var general_max_monochrome_constraint_flag = read_bits(pSPSBytes, 1);
        var general_intra_constraint_flag = read_bits(pSPSBytes, 1);
        var general_one_picture_only_constraint_flag = read_bits(pSPSBytes, 1);
        var general_lower_bit_rate_constraint_flag = read_bits(pSPSBytes, 1);
        var general_reserved_zero_34bits = read_bits(pSPSBytes, 34);
      } else {
        var general_reserved_zero_43bits = read_bits(pSPSBytes, 43);
      }

      if( ( general_profile_idc  >=  1  &&  general_profile_idc  <=  5 )  ||
         general_profile_compatibility_flag[1]  ||  general_profile_compatibility_flag[ 2 ]  ||
         general_profile_compatibility_flag[3]  ||  general_profile_compatibility_flag[ 4 ]  ||
         general_profile_compatibility_flag[5] ) {
        /* The number of bits in this syntax structure is not affected by this condition */
        var general_inbld_flag = read_bits(pSPSBytes, 1);
      } else {
        var general_reserved_zero_bit = read_bits(pSPSBytes, 1);
      }

      var general_level_idc = read_bits(pSPSBytes, 8);
      var sub_layer_profile_present_flag = new Array(maxNumSubLayersMinus1);
      var sub_layer_level_present_flag = new Array(maxNumSubLayersMinus1);

      for( i = 0; i < maxNumSubLayersMinus1; i++ ) {
        sub_layer_profile_present_flag[i] = read_bits(pSPSBytes, 1);
        sub_layer_level_present_flag[i] = read_bits(pSPSBytes, 1);
      }

      var reserved_zero_2bits = new Array(8);
      var sub_layer_profile_idc = new Array(maxNumSubLayersMinus1);

      if( maxNumSubLayersMinus1 > 0 ) {
        for(var i = maxNumSubLayersMinus1; i < 8; i++ ) {
          reserved_zero_2bits[i] = read_bits(pSPSBytes, 1);
        }
      }

      for(var i = 0; i < maxNumSubLayersMinus1; i++ ) {
        if( sub_layer_profile_present_flag[i] ) {
          var sub_layer_profile_space = read_bits(pSPSBytes, 2);
          var sub_layer_tier_flag = read_bits(pSPSBytes, 1); 
          sub_layer_profile_idc[i] = read_bits(pSPSBytes, 5);
          
          for(var j = 0; j < 32; j++ ) {
            sub_layer_profile_compatibility_flag[i][j] = read_bits(pSPSBytes, 1);
          }

          var sub_layer_progressive_source_flag = read_bits(pSPSBytes, 1);
          var sub_layer_interlaced_source_flag = read_bits(pSPSBytes, 1);
          var sub_layer_non_packed_constraint_flag = read_bits(pSPSBytes, 1);
          var sub_layer_frame_only_constraint_flag = read_bits(pSPSBytes, 1);

          if( sub_layer_profile_idc[i]  ==  4  ||  sub_layer_profile_compatibility_flag[i][4]  ||
            sub_layer_profile_idc[i]  ==  5  ||  sub_layer_profile_compatibility_flag[i][5]  ||
            sub_layer_profile_idc[i]  ==  6  ||  sub_layer_profile_compatibility_flag[i][6]  ||
            sub_layer_profile_idc[i]  ==  7  ||  sub_layer_profile_compatibility_flag[i][7] ) {
            /* The number of bits in this syntax structure is not affected by this condition */
            var sub_layer_max_12bit_constraint_flag = read_bits(pSPSBytes, 1);
            var sub_layer_max_10bit_constraint_flag = read_bits(pSPSBytes, 1);
            var sub_layer_max_8bit_constraint_flag = read_bits(pSPSBytes, 1);
            var sub_layer_max_422chroma_constraint_flag = read_bits(pSPSBytes, 1);
            var sub_layer_max_420chroma_constraint_flag = read_bits(pSPSBytes, 1);
            var sub_layer_max_monochrome_constraint_flag = read_bits(pSPSBytes, 1);
            var sub_layer_intra_constraint_flag = read_bits(pSPSBytes, 1);
            var sub_layer_one_picture_only_constraint_flag = read_bits(pSPSBytes, 1);
            var sub_layer_lower_bit_rate_constraint_flag = read_bits(pSPSBytes, 1);
            var sub_layer_reserved_zero_34bits = read_bits(pSPSBytes, 34);
          } else {
            var sub_layer_reserved_zero_43bits = read_bits(pSPSBytes, 43);
          }

          if((sub_layer_profile_idc[i]  >=  1  &&  sub_layer_profile_idc[i]  <=  5 )  ||
             sub_layer_profile_compatibility_flag[1]  ||
             sub_layer_profile_compatibility_flag[2]  ||
             sub_layer_profile_compatibility_flag[3]  ||
             sub_layer_profile_compatibility_flag[4]  ||
             sub_layer_profile_compatibility_flag[5] ) {
            /* The number of bits in this syntax structure is not affected by this condition */
            var sub_layer_inbld_flag = read_bits(pSPSBytes, 1);
          } else {
            var sub_layer_reserved_zero_bit = read_bits(pSPSBytes, 1);
          }
        }

        if(sub_layer_level_present_flag[i]) {
          var sub_layer_level_idc = read_bits(pSPSBytes, 8);
        }
      }
    }
    
    Constructor.prototype = {
        parse: function (pSPSBytes)
        {
           //console.log("=========================SPS START=========================");
           vBitCount = 0;

          var forbidden_zero_bit = read_bits(pSPSBytes, 1);
          var nal_unit_type = read_bits(pSPSBytes, 6);
          var nuh_layer_id = read_bits(pSPSBytes, 6);
          var nuh_temporal_id_plus1 = read_bits(pSPSBytes, 3);

          var sps_video_parameter_set_id = read_bits(pSPSBytes, 4);
          var sps_max_sub_layers_minus1 = read_bits(pSPSBytes, 3);
          var sps_temporal_id_nesting_flag = read_bits(pSPSBytes, 1);
          //profile_tier_level(pSPSBytes, sps_max_sub_layers_minus1);
          read_bits(pSPSBytes, 84);

          var sps_seq_parameter_set_id = ue(pSPSBytes, 0);
          var chroma_format_idc = ue(pSPSBytes, 0);

          if( chroma_format_idc === 3 )
            var separate_colour_plane_flag = read_bits(pSPSBytes, 1);

          var pic_width_in_luma_samples = ue(pSPSBytes, 0);
          var pic_height_in_luma_samples = ue(pSPSBytes, 0);

          //console.log("=========================SPS END=========================");

          var resolution = {
            'width': pic_width_in_luma_samples,
            'height': pic_height_in_luma_samples
          };

          return resolution;
        }
    };
    return new Constructor();
}